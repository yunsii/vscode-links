//! Single entry point that mirrors the TS `resolve()` from
//! `packages/core/src/resolve.ts`. Same inputs, same outputs.

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use crate::csv::{CsvFetcher, FetchError, HttpCsvFetcher, RemoteCsvRow, parse_csv};
use crate::git::get_current_repo_url;
use crate::providers::{cnb, coding, github};
use crate::schemas::{BaseLinkResource, LinkResourceType};
use crate::template::{TemplateRenderError, TemplateRenderErrorReason, render_template};

const SHARED_PROJECT: &str = "#shared-links";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LocalLinkInput {
    pub url: String,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub meta: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RemoteResources {
    pub url: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub project: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub struct LinksConfig {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resources: Option<Vec<LocalLinkInput>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub remote_resources: Option<RemoteResources>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EditorContext {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub file_relative_path: Option<String>,
}

pub struct ResolveOptions<'a> {
    pub cwd: PathBuf,
    pub config: LinksConfig,
    pub editor_context: Option<EditorContext>,
    pub fail_soft: bool,
    pub fetcher: Option<&'a dyn CsvFetcher>,
}

impl<'a> ResolveOptions<'a> {
    pub fn new(cwd: impl Into<PathBuf>) -> Self {
        Self {
            cwd: cwd.into(),
            config: LinksConfig::default(),
            editor_context: None,
            fail_soft: true,
            fetcher: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ResolvedLink {
    #[serde(rename = "type")]
    pub r#type: LinkResourceType,
    pub source: String,
    pub url: String,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SkipReason {
    InvalidSyntax,
    UnknownVariable,
    NullValue,
    FetchFailed,
}

impl From<TemplateRenderErrorReason> for SkipReason {
    fn from(value: TemplateRenderErrorReason) -> Self {
        match value {
            TemplateRenderErrorReason::InvalidSyntax => Self::InvalidSyntax,
            TemplateRenderErrorReason::UnknownVariable => Self::UnknownVariable,
            TemplateRenderErrorReason::NullValue => Self::NullValue,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SkippedLink {
    pub source: String,
    pub raw: BaseLinkResource,
    pub reason: SkipReason,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub variable: Option<String>,
    pub message: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DiagnosticLevel {
    Warn,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ResolveDiagnostic {
    pub level: DiagnosticLevel,
    pub source: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ResolveResult {
    pub context: Value,
    pub links: Vec<ResolvedLink>,
    pub skipped: Vec<SkippedLink>,
    pub diagnostics: Vec<ResolveDiagnostic>,
}

#[derive(Debug, thiserror::Error)]
pub enum ResolveError {
    #[error(transparent)]
    Csv(#[from] FetchError),
}

pub fn resolve(options: ResolveOptions<'_>) -> Result<ResolveResult, ResolveError> {
    let repo_url = try_get_repo_url(&options.cwd);
    let context = build_context(
        &options.cwd,
        repo_url.as_deref(),
        options
            .editor_context
            .as_ref()
            .and_then(|c| c.file_relative_path.as_deref()),
    );

    let mut links: Vec<ResolvedLink> = Vec::new();
    let mut skipped: Vec<SkippedLink> = Vec::new();
    let mut diagnostics: Vec<ResolveDiagnostic> = Vec::new();

    // 1. Local (links.resources)
    for raw_input in options.config.resources.iter().flatten() {
        let raw = BaseLinkResource {
            url: raw_input.url.clone(),
            title: raw_input.title.clone(),
            description: raw_input.description.clone(),
            r#type: LinkResourceType::Local,
            meta: raw_input.meta.clone(),
        };
        render_into(
            "settings:links.resources",
            raw,
            &context,
            &mut links,
            &mut skipped,
            &mut diagnostics,
        );
    }

    // 2. Detected (per-platform from git remote)
    if let Some(repo_url) = repo_url.as_deref() {
        if github::ensure_github_repo_url(repo_url) {
            let p = github::parse_github_repo_url(repo_url);
            for raw in github::get_github_repo_links(&p.owner, &p.repo) {
                render_into(
                    "detected:github",
                    raw,
                    &context,
                    &mut links,
                    &mut skipped,
                    &mut diagnostics,
                );
            }
        } else if cnb::ensure_cnb_repo_url(repo_url) {
            let p = cnb::parse_cnb_repo_url(repo_url);
            for raw in cnb::get_cnb_repo_links(&p.groups, &p.repo) {
                render_into(
                    "detected:cnb",
                    raw,
                    &context,
                    &mut links,
                    &mut skipped,
                    &mut diagnostics,
                );
            }
        } else if coding::ensure_coding_repo_url(repo_url)
            && let Ok(p) = coding::parse_coding_repo_url(repo_url)
        {
            for raw in coding::get_coding_repo_links(&p.team, &p.project, &p.repo) {
                render_into(
                    "detected:coding",
                    raw,
                    &context,
                    &mut links,
                    &mut skipped,
                    &mut diagnostics,
                );
            }
        }
    }

    // 3. Remote CSV
    if let Some(remote) = options.config.remote_resources.as_ref()
        && !remote.url.is_empty()
    {
        let default_fetcher = HttpCsvFetcher::new();
        let fetcher: &dyn CsvFetcher = options.fetcher.unwrap_or(&default_fetcher);
        match fetch_and_parse_csv(fetcher, &remote.url) {
            Ok(rows) => {
                for row in rows {
                    if row.url.is_empty() {
                        continue;
                    }
                    let project = remote.project.as_deref().unwrap_or("");
                    let (source, kind) = if row.project == project {
                        ("csv:project", LinkResourceType::RemoteProject)
                    } else if row.project == SHARED_PROJECT {
                        ("csv:#shared-links", LinkResourceType::RemoteShared)
                    } else {
                        continue;
                    };
                    let raw = BaseLinkResource {
                        url: row.url,
                        title: row.title,
                        description: row.description,
                        r#type: kind,
                        meta: None,
                    };
                    render_into(
                        source,
                        raw,
                        &context,
                        &mut links,
                        &mut skipped,
                        &mut diagnostics,
                    );
                }
            }
            Err(err) => {
                if !options.fail_soft {
                    return Err(ResolveError::Csv(err));
                }
                diagnostics.push(ResolveDiagnostic {
                    level: DiagnosticLevel::Warn,
                    source: "csv:fetch".to_string(),
                    message: format!("Failed to fetch remote CSV: {err}"),
                });
            }
        }
    }

    Ok(ResolveResult {
        context,
        links,
        skipped,
        diagnostics,
    })
}

fn try_get_repo_url(cwd: &Path) -> Option<String> {
    get_current_repo_url(cwd).ok().flatten()
}

fn build_context(cwd: &Path, repo_url: Option<&str>, file_relative_path: Option<&str>) -> Value {
    let branch = crate::git::get_current_branch(cwd).ok().flatten();

    let mut ctx = json!({
        "repo": { "url": repo_url },
        "git": { "branch": branch },
        "workspace": { "fileRelativePath": file_relative_path },
        "repoSpecific": {},
    });

    if let Some(repo_url) = repo_url {
        let repo_specific = ctx
            .get_mut("repoSpecific")
            .and_then(Value::as_object_mut)
            .unwrap();
        if github::ensure_github_repo_url(repo_url) {
            let p = github::parse_github_repo_url(repo_url);
            repo_specific.insert(
                "github".to_string(),
                json!({ "owner": p.owner, "repo": p.repo }),
            );
        } else if cnb::ensure_cnb_repo_url(repo_url) {
            let p = cnb::parse_cnb_repo_url(repo_url);
            repo_specific.insert(
                "cnb".to_string(),
                json!({ "repo": p.repo, "groups": p.groups.join("/") }),
            );
        } else if coding::ensure_coding_repo_url(repo_url)
            && let Ok(p) = coding::parse_coding_repo_url(repo_url)
        {
            repo_specific.insert(
                "coding".to_string(),
                json!({ "team": p.team, "project": p.project, "repo": p.repo }),
            );
        }
    }

    ctx
}

fn fetch_and_parse_csv(
    fetcher: &dyn CsvFetcher,
    url: &str,
) -> Result<Vec<RemoteCsvRow>, FetchError> {
    let body = fetcher.fetch(url)?;
    parse_csv(&body)
}

fn render_into(
    source: &str,
    raw: BaseLinkResource,
    context: &Value,
    links: &mut Vec<ResolvedLink>,
    skipped: &mut Vec<SkippedLink>,
    diagnostics: &mut Vec<ResolveDiagnostic>,
) {
    match render_resource(&raw, context) {
        Ok(rendered) => links.push(ResolvedLink {
            r#type: rendered.r#type,
            source: source.to_string(),
            url: rendered.url,
            title: rendered.title,
            description: rendered.description,
        }),
        Err(RenderResourceError::Template(err)) => skipped.push(SkippedLink {
            source: source.to_string(),
            raw,
            reason: err.reason.into(),
            variable: Some(err.variable),
            message: err.message,
        }),
        Err(RenderResourceError::Other(msg)) => diagnostics.push(ResolveDiagnostic {
            level: DiagnosticLevel::Error,
            source: source.to_string(),
            message: format!("unexpected render error: {msg}"),
        }),
    }
}

#[derive(Debug)]
enum RenderResourceError {
    Template(TemplateRenderError),
    #[allow(dead_code)]
    Other(String),
}

fn render_resource(
    resource: &BaseLinkResource,
    context: &Value,
) -> Result<BaseLinkResource, RenderResourceError> {
    let url = render_template(&resource.url, context).map_err(RenderResourceError::Template)?;
    let title = render_template(&resource.title, context).map_err(RenderResourceError::Template)?;
    let description = match &resource.description {
        Some(d) => Some(render_template(d, context).map_err(RenderResourceError::Template)?),
        None => None,
    };
    Ok(BaseLinkResource {
        url,
        title,
        description,
        r#type: resource.r#type,
        meta: resource.meta.clone(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::csv::test_support::{FailingFetcher, StaticFetcher};

    fn isolated_cwd() -> PathBuf {
        // A path that does not exist anywhere; git commands will fail
        // and resolve() must short-circuit gracefully.
        PathBuf::from("/this/path/should/not/exist/anywhere/12345")
    }

    #[test]
    fn empty_repo_no_config_returns_empty_lists() {
        let opts = ResolveOptions::new(isolated_cwd());
        let r = resolve(opts).unwrap();
        assert!(r.links.is_empty());
        assert!(r.skipped.is_empty());
    }

    #[test]
    fn renders_a_static_local_link_from_config() {
        let mut opts = ResolveOptions::new(isolated_cwd());
        opts.config.resources = Some(vec![LocalLinkInput {
            url: "https://example.com/wiki".to_string(),
            title: "Team wiki".to_string(),
            description: None,
            meta: None,
        }]);
        let r = resolve(opts).unwrap();
        assert_eq!(r.links.len(), 1);
        assert_eq!(r.links[0].r#type, LinkResourceType::Local);
        assert_eq!(r.links[0].source, "settings:links.resources");
        assert_eq!(r.links[0].url, "https://example.com/wiki");
    }

    #[test]
    fn skips_a_config_row_with_unknown_template_variable() {
        let mut opts = ResolveOptions::new(isolated_cwd());
        opts.config.resources = Some(vec![LocalLinkInput {
            url: "https://example.com/{{custom.var}}".to_string(),
            title: "Bad".to_string(),
            description: None,
            meta: None,
        }]);
        let r = resolve(opts).unwrap();
        assert!(r.links.is_empty());
        assert_eq!(r.skipped.len(), 1);
        assert_eq!(r.skipped[0].reason, SkipReason::UnknownVariable);
        assert_eq!(r.skipped[0].variable.as_deref(), Some("custom.var"));
    }

    #[test]
    fn skips_a_config_row_resolving_to_null_in_this_context() {
        let mut opts = ResolveOptions::new(isolated_cwd());
        opts.config.resources = Some(vec![LocalLinkInput {
            url: "https://example.com/blob/{{git.branch}}/{{workspace.fileRelativePath}}"
                .to_string(),
            title: "File".to_string(),
            description: None,
            meta: None,
        }]);
        let r = resolve(opts).unwrap();
        assert_eq!(r.skipped.len(), 1);
        assert_eq!(r.skipped[0].reason, SkipReason::NullValue);
    }

    #[test]
    fn fail_soft_records_csv_diagnostic_and_no_links() {
        let mut opts = ResolveOptions::new(isolated_cwd());
        opts.config.remote_resources = Some(RemoteResources {
            url: "mock://anything".to_string(),
            project: None,
        });
        let fetcher = FailingFetcher;
        opts.fetcher = Some(&fetcher);
        let r = resolve(opts).unwrap();
        assert!(r.diagnostics.iter().any(|d| d.source == "csv:fetch"));
        assert!(r.links.is_empty());
    }

    #[test]
    fn fail_soft_false_propagates_csv_error() {
        let mut opts = ResolveOptions::new(isolated_cwd());
        opts.config.remote_resources = Some(RemoteResources {
            url: "mock://anything".to_string(),
            project: None,
        });
        opts.fail_soft = false;
        let fetcher = FailingFetcher;
        opts.fetcher = Some(&fetcher);
        let err = resolve(opts).unwrap_err();
        assert!(matches!(err, ResolveError::Csv(_)));
    }

    #[test]
    fn detected_github_links_emit_when_run_inside_this_repo() {
        let opts = ResolveOptions::new(".");
        let r = resolve(opts).unwrap();
        let detected: Vec<_> = r
            .links
            .iter()
            .filter(|l| l.source == "detected:github")
            .collect();
        assert!(
            !detected.is_empty(),
            "no detected:github links: {:?}",
            r.links
        );
        assert!(detected.iter().any(|l| l.title == "GitHub Repo"));
    }

    #[test]
    fn detected_github_rows_needing_editor_context_end_up_in_skipped() {
        let opts = ResolveOptions::new(".");
        let r = resolve(opts).unwrap();
        assert!(
            r.skipped
                .iter()
                .any(|s| s.raw.title == "GitHub Repo Current File"),
            "skipped: {:?}",
            r.skipped
        );
    }

    #[test]
    fn csv_shared_and_project_rows_partition_correctly() {
        let mut opts = ResolveOptions::new(isolated_cwd());
        opts.config.remote_resources = Some(RemoteResources {
            url: "mock://csv".to_string(),
            project: Some("proj-x".to_string()),
        });
        let body = r#"url,title,description,project
https://example.com/a,Project A,, proj-x
https://example.com/b,Shared B,,#shared-links
https://example.com/c,Other,,other-proj
"#;
        let fetcher = StaticFetcher {
            body: body.to_string(),
        };
        opts.fetcher = Some(&fetcher);
        let r = resolve(opts).unwrap();
        // Note: ` proj-x` (leading space) does NOT match "proj-x" — the
        // CSV crate keeps surrounding whitespace, mirroring papaparse.
        // The shared row matches; the project row does not.
        let sources: Vec<_> = r.links.iter().map(|l| l.source.as_str()).collect();
        assert!(sources.contains(&"csv:#shared-links"));
        assert!(!sources.contains(&"csv:project"));
    }
}
