//! E2E tests for the CLI surface. Calls `run()` directly (no
//! subprocess) so the test loop stays fast; the bin is a one-line
//! wrapper around it so this exercises the same code path.

use std::fs;
use std::path::PathBuf;

use serde_json::Value;
use vscode_links_cli::{run, EXIT_CONFIG, EXIT_OK, EXIT_USAGE};

fn tmp_dir(label: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "vscl-rust-cli-{}-{}-{}",
        label,
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn argv(parts: &[&str]) -> Vec<String> {
    parts.iter().map(|s| s.to_string()).collect()
}

#[test]
fn prints_help_when_called_with_no_args() {
    let r = run(&argv(&[]));
    assert_eq!(r.exit_code, EXIT_OK);
    assert!(r.stdout.contains("Usage:"));
}

#[test]
fn prints_help_with_long_flag() {
    let r = run(&argv(&["--help"]));
    assert_eq!(r.exit_code, EXIT_OK);
    assert!(r.stdout.contains("Usage:"));
}

#[test]
fn rejects_unknown_subcommand_with_usage_error() {
    let r = run(&argv(&["foo"]));
    assert_eq!(r.exit_code, EXIT_USAGE);
    assert!(r.stderr.contains("error"));
}

#[test]
fn rejects_resolve_without_cwd() {
    let r = run(&argv(&["resolve"]));
    assert_eq!(r.exit_code, EXIT_USAGE);
}

#[test]
fn rejects_unknown_format_value() {
    let dir = tmp_dir("bad-format");
    let r = run(&argv(&["resolve", "--cwd", dir.to_str().unwrap(), "--format", "xml"]));
    assert_eq!(r.exit_code, EXIT_USAGE);
    assert!(r.stderr.contains("--format must be one of"));
    fs::remove_dir_all(&dir).ok();
}

#[test]
fn emits_json_by_default_for_an_empty_workspace() {
    let dir = tmp_dir("empty-json");
    let r = run(&argv(&["resolve", "--cwd", dir.to_str().unwrap()]));
    assert_eq!(r.exit_code, EXIT_OK);
    let parsed: Value = serde_json::from_str(&r.stdout).unwrap();
    assert!(parsed.get("context").is_some());
    let links = parsed.get("links").unwrap().as_array().unwrap();
    assert_eq!(links.len(), 0);
    fs::remove_dir_all(&dir).ok();
}

#[test]
fn emits_ndjson_with_one_record_per_line() {
    let dir = tmp_dir("ndjson");
    let r = run(&argv(&["resolve", "--cwd", dir.to_str().unwrap(), "--format", "ndjson"]));
    assert_eq!(r.exit_code, EXIT_OK);
    let lines: Vec<&str> = r.stdout.trim().split('\n').filter(|s| !s.is_empty()).collect();
    assert!(!lines.is_empty());
    let first: Value = serde_json::from_str(lines[0]).unwrap();
    assert_eq!(first["kind"], "context");
    fs::remove_dir_all(&dir).ok();
}

#[test]
fn emits_empty_tsv_when_no_links() {
    let dir = tmp_dir("empty-tsv");
    let r = run(&argv(&["resolve", "--cwd", dir.to_str().unwrap(), "--format", "tsv"]));
    assert_eq!(r.exit_code, EXIT_OK);
    assert_eq!(r.stdout, "");
    fs::remove_dir_all(&dir).ok();
}

#[test]
fn reads_vscode_settings_jsonc_and_renders_local_links_as_tsv() {
    let dir = tmp_dir("with-settings");
    let vscode = dir.join(".vscode");
    fs::create_dir_all(&vscode).unwrap();
    fs::write(
        vscode.join("settings.json"),
        r#"{
            // VS Code-style JSONC with comments + trailing comma
            "links.resources": [
                { "url": "https://example.com/wiki", "title": "Team wiki", },
            ],
        }"#,
    )
    .unwrap();

    let r = run(&argv(&["resolve", "--cwd", dir.to_str().unwrap(), "--format", "tsv"]));
    assert_eq!(r.exit_code, EXIT_OK, "stderr was {:?}", r.stderr);
    let rows: Vec<&str> = r.stdout.trim().split('\n').collect();
    assert_eq!(rows.len(), 1);
    let cells: Vec<&str> = rows[0].split('\t').collect();
    assert_eq!(cells[0], "local");
    assert_eq!(cells[1], "settings:links.resources");
    assert_eq!(cells[2], "https://example.com/wiki");
    assert_eq!(cells[3], "Team wiki");
    fs::remove_dir_all(&dir).ok();
}

#[test]
fn returns_exit_code_3_on_invalid_settings_json() {
    let dir = tmp_dir("bad-settings");
    let vscode = dir.join(".vscode");
    fs::create_dir_all(&vscode).unwrap();
    fs::write(vscode.join("settings.json"), "{ this is not json").unwrap();
    let r = run(&argv(&["resolve", "--cwd", dir.to_str().unwrap()]));
    assert_eq!(r.exit_code, EXIT_CONFIG);
    assert!(r.stderr.contains("failed to load settings"));
    fs::remove_dir_all(&dir).ok();
}

#[test]
fn accepts_editor_context_as_json_object() {
    let dir = tmp_dir("editor-ctx");
    let r = run(&argv(&[
        "resolve",
        "--cwd",
        dir.to_str().unwrap(),
        "--editor-context",
        r#"{"fileRelativePath":"src/x.ts"}"#,
    ]));
    assert_eq!(r.exit_code, EXIT_OK);
    let parsed: Value = serde_json::from_str(&r.stdout).unwrap();
    assert_eq!(parsed["context"]["workspace"]["fileRelativePath"], "src/x.ts");
    fs::remove_dir_all(&dir).ok();
}

#[test]
fn rejects_malformed_editor_context() {
    let dir = tmp_dir("bad-editor-ctx");
    let r = run(&argv(&["resolve", "--cwd", dir.to_str().unwrap(), "--editor-context", "not-json"]));
    assert_eq!(r.exit_code, EXIT_USAGE);
    assert!(r.stderr.contains("--editor-context is not valid JSON"));
    fs::remove_dir_all(&dir).ok();
}
