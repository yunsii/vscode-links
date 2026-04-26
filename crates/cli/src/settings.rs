//! Walk up from a cwd to the nearest `.vscode/settings.json` and
//! project the `links.*` keys into a `LinksConfig`. Mirrors
//! `packages/cli/src/settings.ts`.

use std::path::{Path, PathBuf};

use serde::Deserialize;
use serde_json::Value;
use thiserror::Error;
use vscode_links_core::{LinksConfig, LocalLinkInput, RemoteResources};

use crate::jsonc::{JsoncParseError, parse_jsonc};

#[derive(Debug, Error)]
pub enum SettingsError {
    #[error("read failed: {0}")]
    Read(#[from] std::io::Error),
    #[error(transparent)]
    Parse(#[from] JsoncParseError),
}

#[derive(Debug, Clone, Default, Deserialize)]
struct RawSettings {
    #[serde(rename = "links.resources", default)]
    resources: Option<Value>,
    #[serde(rename = "links.remoteResources", default)]
    remote_resources: Option<Value>,
}

/// Walk upward from `cwd` until `.vscode/settings.json` is found.
/// Returns `None` if no such file exists between `cwd` and the
/// filesystem root.
pub fn find_workspace_settings(cwd: &Path) -> Option<PathBuf> {
    let mut dir = cwd.to_path_buf();
    loop {
        let candidate = dir.join(".vscode").join("settings.json");
        if candidate.is_file() {
            return Some(candidate);
        }
        match dir.parent() {
            Some(p) => dir = p.to_path_buf(),
            None => return None,
        }
    }
}

/// Load a VS Code settings.json (JSONC) file and project the `links.*`
/// keys. Other keys are ignored. An empty/null document returns an
/// empty config.
pub fn load_links_config_from_file(file: &Path) -> Result<LinksConfig, SettingsError> {
    let text = std::fs::read_to_string(file)?;
    let raw: Option<RawSettings> = parse_jsonc::<Option<RawSettings>>(&text)?;
    Ok(project(raw.unwrap_or_default()))
}

/// Resolve the effective `LinksConfig` for `cwd`: looks up the nearest
/// `.vscode/settings.json` and projects it, or returns an empty config
/// when no settings file is found.
pub fn load_links_config_from_cwd(cwd: &Path) -> Result<LinksConfig, SettingsError> {
    match find_workspace_settings(cwd) {
        Some(file) => load_links_config_from_file(&file),
        None => Ok(LinksConfig::default()),
    }
}

fn project(raw: RawSettings) -> LinksConfig {
    let mut out = LinksConfig::default();

    if let Some(Value::Array(items)) = raw.resources {
        let mut links = Vec::with_capacity(items.len());
        for item in items {
            if let Ok(v) = serde_json::from_value::<LocalLinkInput>(item) {
                links.push(v);
            }
        }
        out.resources = Some(links);
    }

    if let Some(value) = raw.remote_resources {
        // The schema's `oneOf` allows null; treat it as "not configured".
        if !value.is_null() {
            if let Ok(rr) = serde_json::from_value::<RemoteResources>(value) {
                if !rr.url.is_empty() {
                    out.remote_resources = Some(rr);
                }
            }
        }
    }

    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn tmp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "vscl-cli-{}-{}-{}",
            name,
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn returns_empty_config_when_no_settings_file_exists() {
        let dir = tmp_dir("empty");
        let cfg = load_links_config_from_cwd(&dir).unwrap();
        assert!(cfg.resources.is_none());
        assert!(cfg.remote_resources.is_none());
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn parses_jsonc_with_comments_and_trailing_commas() {
        let dir = tmp_dir("jsonc");
        let vscode = dir.join(".vscode");
        fs::create_dir_all(&vscode).unwrap();
        fs::write(
            vscode.join("settings.json"),
            r#"{
                // VS Code-style JSONC
                "links.resources": [
                    { "url": "https://x/", "title": "X", },
                ],
            }"#,
        )
        .unwrap();
        let cfg = load_links_config_from_cwd(&dir).unwrap();
        let resources = cfg.resources.unwrap();
        assert_eq!(resources.len(), 1);
        assert_eq!(resources[0].url, "https://x/");
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn ignores_remote_resources_when_null() {
        let dir = tmp_dir("null-remote");
        let vscode = dir.join(".vscode");
        fs::create_dir_all(&vscode).unwrap();
        fs::write(
            vscode.join("settings.json"),
            r#"{ "links.remoteResources": null }"#,
        )
        .unwrap();
        let cfg = load_links_config_from_cwd(&dir).unwrap();
        assert!(cfg.remote_resources.is_none());
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn accepts_remote_resources_with_url_and_project() {
        let dir = tmp_dir("remote");
        let vscode = dir.join(".vscode");
        fs::create_dir_all(&vscode).unwrap();
        fs::write(
            vscode.join("settings.json"),
            r#"{ "links.remoteResources": { "url": "https://csv/", "project": "p" } }"#,
        )
        .unwrap();
        let cfg = load_links_config_from_cwd(&dir).unwrap();
        let rr = cfg.remote_resources.unwrap();
        assert_eq!(rr.url, "https://csv/");
        assert_eq!(rr.project.as_deref(), Some("p"));
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn walks_up_to_find_vscode_settings() {
        let root = tmp_dir("walk-up");
        let nested = root.join("a").join("b").join("c");
        fs::create_dir_all(&nested).unwrap();
        fs::create_dir_all(root.join(".vscode")).unwrap();
        fs::write(
            root.join(".vscode").join("settings.json"),
            r#"{ "links.resources": [{ "url": "https://wiki/", "title": "Wiki" }] }"#,
        )
        .unwrap();
        let cfg = load_links_config_from_cwd(&nested).unwrap();
        assert!(cfg.resources.is_some());
        fs::remove_dir_all(&root).unwrap();
    }
}
