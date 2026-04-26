//! Whitelist template engine. Mirrors the TS implementation in
//! `packages/core/src/template/adapter.ts`. The contract:
//!
//! - syntax is `{{ <path> }}` (whitespace tolerated inside the braces);
//! - `<path>` must be an entry in [`ALLOWED_TEMPLATE_VARIABLES`];
//! - the engine never evaluates expressions and never embeds JS.

use std::sync::OnceLock;

use regex::Regex;
use serde_json::Value;
use thiserror::Error;

/// Documented context paths that may appear inside `{{ ... }}`.
/// Adding an entry is a minor schema bump; removing/renaming is breaking.
pub const ALLOWED_TEMPLATE_VARIABLES: &[&str] = &[
    "repo.url",
    "git.branch",
    "workspace.fileRelativePath",
    "repoSpecific.github.owner",
    "repoSpecific.github.repo",
    "repoSpecific.cnb.repo",
    "repoSpecific.cnb.groups",
    "repoSpecific.coding.team",
    "repoSpecific.coding.project",
    "repoSpecific.coding.repo",
];

pub type AllowedTemplateVariable = &'static str;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TemplateRenderErrorReason {
    InvalidSyntax,
    UnknownVariable,
    NullValue,
}

#[derive(Debug, Error)]
#[error("{message}")]
pub struct TemplateRenderError {
    pub reason: TemplateRenderErrorReason,
    pub variable: String,
    pub message: String,
}

/// Substitute every `{{ <path> }}` with the value at `<path>` in
/// `context`. Returns:
///
/// - `Ok(rendered)` when every placeholder resolved to a non-null value;
/// - `Err(TemplateRenderError)` on the first offending placeholder. The
///   error mirrors the TS `reason` enum so consumers can react
///   identically across runtimes.
pub fn render_template(template: &str, context: &Value) -> Result<String, TemplateRenderError> {
    if template.is_empty() {
        return Ok(String::new());
    }

    let placeholder_re = placeholder_re();
    let mut out = String::with_capacity(template.len());
    let mut last_end = 0usize;

    for caps in placeholder_re.captures_iter(template) {
        let m = caps.get(0).unwrap();
        out.push_str(&template[last_end..m.start()]);

        let raw = caps.get(1).unwrap().as_str();
        let path = raw.trim();

        if !path_re().is_match(path) {
            return Err(TemplateRenderError {
                reason: TemplateRenderErrorReason::InvalidSyntax,
                variable: path.to_string(),
                message: format!(
                    "Invalid template syntax: {{{{{raw}}}}}. Only dotted paths are supported (e.g. {{{{repo.url}}}}); expressions and operators are not."
                ),
            });
        }

        if !is_allowed(path) {
            return Err(TemplateRenderError {
                reason: TemplateRenderErrorReason::UnknownVariable,
                variable: path.to_string(),
                message: format!(
                    "Unknown template variable: {{{{{path}}}}}. Supported variables: {}.",
                    ALLOWED_TEMPLATE_VARIABLES.join(", ")
                ),
            });
        }

        match lookup(context, path) {
            Some(v) if !v.is_null() => out.push_str(&value_to_string(v)),
            _ => {
                return Err(TemplateRenderError {
                    reason: TemplateRenderErrorReason::NullValue,
                    variable: path.to_string(),
                    message: format!(
                        "Template variable {{{{{path}}}}} resolved to null in this context."
                    ),
                });
            }
        }

        last_end = m.end();
    }

    out.push_str(&template[last_end..]);
    Ok(out)
}

fn placeholder_re() -> &'static Regex {
    static R: OnceLock<Regex> = OnceLock::new();
    R.get_or_init(|| Regex::new(r"\{\{([^}]*)\}\}").unwrap())
}

fn path_re() -> &'static Regex {
    static R: OnceLock<Regex> = OnceLock::new();
    R.get_or_init(|| Regex::new(r"^[a-zA-Z_][a-zA-Z0-9_-]*(?:\.[a-zA-Z_][a-zA-Z0-9_-]*)*$").unwrap())
}

fn is_allowed(path: &str) -> bool {
    ALLOWED_TEMPLATE_VARIABLES.iter().any(|v| *v == path)
}

fn lookup<'a>(ctx: &'a Value, path: &str) -> Option<&'a Value> {
    let mut cursor = ctx;
    for key in path.split('.') {
        cursor = cursor.get(key)?;
    }
    Some(cursor)
}

fn value_to_string(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        Value::Bool(b) => b.to_string(),
        // matching JS `String(value)` for arrays/objects is awkward and
        // the contract only puts strings at allowed paths, so render
        // the JSON form for diagnostics rather than throw.
        other => other.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn full_ctx() -> Value {
        json!({
            "repo": { "url": "https://github.com/owner/repo.git" },
            "git": { "branch": "feat-x" },
            "workspace": { "fileRelativePath": "src/x.ts" },
            "repoSpecific": {
                "github": { "owner": "owner", "repo": "repo" },
                "cnb": { "repo": "repo", "groups": "g/sg" },
                "coding": { "team": "team", "project": "project", "repo": "repo" },
            }
        })
    }

    #[test]
    fn returns_input_unchanged_without_placeholders() {
        let out = render_template("plain text", &json!({})).unwrap();
        assert_eq!(out, "plain text");
    }

    #[test]
    fn returns_input_unchanged_when_empty() {
        let out = render_template("", &json!({"x": "1"})).unwrap();
        assert_eq!(out, "");
    }

    #[test]
    fn substitutes_a_single_allowed_variable() {
        let out = render_template("{{repo.url}}", &full_ctx()).unwrap();
        assert_eq!(out, "https://github.com/owner/repo.git");
    }

    #[test]
    fn substitutes_multiple_allowed_variables_in_one_template() {
        let out = render_template(
            "{{repo.url}}/blob/{{git.branch}}/{{workspace.fileRelativePath}}",
            &full_ctx(),
        )
        .unwrap();
        assert_eq!(
            out,
            "https://github.com/owner/repo.git/blob/feat-x/src/x.ts"
        );
    }

    #[test]
    fn tolerates_whitespace_inside_braces() {
        let out = render_template("{{  git.branch  }}", &full_ctx()).unwrap();
        assert_eq!(out, "feat-x");
    }

    #[test]
    fn renders_every_documented_variable_from_a_complete_context() {
        let ctx = full_ctx();
        for v in ALLOWED_TEMPLATE_VARIABLES {
            let tpl = format!("x:{{{{{v}}}}}:y");
            let out = render_template(&tpl, &ctx).unwrap();
            assert!(out.starts_with("x:"));
            assert!(out.ends_with(":y"));
            assert!(!out.contains("{{"));
        }
    }

    #[test]
    fn throws_unknown_variable_for_an_undocumented_path() {
        let err = render_template("{{custom.var}}", &full_ctx()).unwrap_err();
        assert_eq!(err.reason, TemplateRenderErrorReason::UnknownVariable);
        assert_eq!(err.variable, "custom.var");
    }

    #[test]
    fn throws_invalid_syntax_for_an_expression() {
        let err = render_template("{{repo.url || 'fallback'}}", &full_ctx()).unwrap_err();
        assert_eq!(err.reason, TemplateRenderErrorReason::InvalidSyntax);
    }

    #[test]
    fn throws_invalid_syntax_for_a_function_call() {
        let err =
            render_template("{{encodeURIComponent(repo.url)}}", &full_ctx()).unwrap_err();
        assert_eq!(err.reason, TemplateRenderErrorReason::InvalidSyntax);
    }

    #[test]
    fn throws_invalid_syntax_for_empty_braces() {
        let err = render_template("{{}}", &full_ctx()).unwrap_err();
        assert_eq!(err.reason, TemplateRenderErrorReason::InvalidSyntax);
    }

    #[test]
    fn throws_null_value_when_an_allowed_variable_is_null_in_this_context() {
        let mut ctx = full_ctx();
        ctx["workspace"]["fileRelativePath"] = Value::Null;
        let err = render_template("{{workspace.fileRelativePath}}", &ctx).unwrap_err();
        assert_eq!(err.reason, TemplateRenderErrorReason::NullValue);
        assert_eq!(err.variable, "workspace.fileRelativePath");
    }

    #[test]
    fn throws_null_value_when_the_parent_path_is_missing_from_context() {
        let err = render_template(
            "{{repoSpecific.github.owner}}",
            &json!({"repo": {"url": "x"}}),
        )
        .unwrap_err();
        assert_eq!(err.reason, TemplateRenderErrorReason::NullValue);
    }
}
