//! Pure orchestration: argv → core::resolve() → formatted string.
//! Mirrors `packages/cli/src/run.ts`. The bin entry only adds stdio
//! and process::exit on top.

use std::path::PathBuf;
use std::str::FromStr;

use clap::{Args, Parser, Subcommand};
use vscode_links_core::{EditorContext, ResolveOptions, resolve};

use crate::format::{OutputFormat, format_result};
use crate::settings::{load_links_config_from_cwd, load_links_config_from_file};

pub type CliExitCode = u8;

pub const EXIT_OK: CliExitCode = 0;
pub const EXIT_USAGE: CliExitCode = 2;
pub const EXIT_CONFIG: CliExitCode = 3;
pub const EXIT_RUNTIME: CliExitCode = 4;

pub struct RunResult {
    pub exit_code: CliExitCode,
    pub stdout: String,
    pub stderr: String,
}

#[derive(Parser)]
#[command(
    name = "vscode-links",
    bin_name = "vscode-links",
    about = "Resolve project links from a workspace + .vscode/settings.json",
    long_about = None,
    version,
    disable_help_subcommand = true,
)]
struct Cli {
    #[command(subcommand)]
    command: Option<Cmd>,
}

#[derive(Subcommand)]
enum Cmd {
    /// Resolve links for a workspace cwd.
    Resolve(ResolveArgs),
}

#[derive(Args)]
struct ResolveArgs {
    /// Workspace / pane cwd (required).
    #[arg(long, value_name = "path")]
    cwd: PathBuf,
    /// Override .vscode/settings.json location.
    #[arg(long, value_name = "path")]
    config: Option<PathBuf>,
    /// JSON object or @file with { "fileRelativePath": "..." }.
    #[arg(long = "editor-context", value_name = "json")]
    editor_context: Option<String>,
    /// Output format: json (default), ndjson, or tsv.
    #[arg(long, value_name = "fmt", default_value = "json")]
    format: String,
}

pub fn run(argv: &[String]) -> RunResult {
    // clap takes the binary name as argv[0]; prepend a stable one.
    let mut full_argv: Vec<String> = Vec::with_capacity(argv.len() + 1);
    full_argv.push("vscode-links".to_string());
    full_argv.extend_from_slice(argv);

    let cli = match Cli::try_parse_from(&full_argv) {
        Ok(v) => v,
        Err(err) => {
            // clap distinguishes a help/version request (exit 0) from a
            // genuine usage error (exit 2). Matches how the TS bin
            // returns 0 for --help.
            let kind = err.kind();
            let rendered = err.render().to_string();
            return if matches!(
                kind,
                clap::error::ErrorKind::DisplayHelp | clap::error::ErrorKind::DisplayVersion
            ) {
                RunResult {
                    exit_code: EXIT_OK,
                    stdout: rendered,
                    stderr: String::new(),
                }
            } else {
                RunResult {
                    exit_code: EXIT_USAGE,
                    stdout: String::new(),
                    stderr: rendered,
                }
            };
        }
    };

    let Some(Cmd::Resolve(args)) = cli.command else {
        // No subcommand: print help.
        let help = <Cli as clap::CommandFactory>::command()
            .render_help()
            .to_string();
        return RunResult {
            exit_code: EXIT_OK,
            stdout: help,
            stderr: String::new(),
        };
    };

    run_resolve(args)
}

fn run_resolve(args: ResolveArgs) -> RunResult {
    let fmt = match OutputFormat::from_str(&args.format) {
        Ok(v) => v,
        Err(msg) => return usage_error(msg),
    };

    let editor_context = match args.editor_context {
        Some(raw) => match parse_editor_context(&raw) {
            Ok(v) => Some(v),
            Err(msg) => return usage_error(msg),
        },
        None => None,
    };

    let config = match args.config.as_deref() {
        Some(path) => load_links_config_from_file(path),
        None => load_links_config_from_cwd(&args.cwd),
    };
    let config = match config {
        Ok(v) => v,
        Err(err) => {
            return RunResult {
                exit_code: EXIT_CONFIG,
                stdout: String::new(),
                stderr: format!("error: failed to load settings: {err}\n"),
            };
        }
    };

    let mut opts = ResolveOptions::new(args.cwd);
    opts.config = config;
    opts.editor_context = editor_context;
    opts.fail_soft = true;

    let result = match resolve(opts) {
        Ok(v) => v,
        Err(err) => {
            return RunResult {
                exit_code: EXIT_RUNTIME,
                stdout: String::new(),
                stderr: format!("error: resolve failed: {err}\n"),
            };
        }
    };

    RunResult {
        exit_code: EXIT_OK,
        stdout: format_result(&result, fmt),
        stderr: String::new(),
    }
}

fn parse_editor_context(value: &str) -> Result<EditorContext, String> {
    let raw = if let Some(path) = value.strip_prefix('@') {
        std::fs::read_to_string(path)
            .map_err(|e| format!("failed to read --editor-context file: {e}"))?
    } else {
        value.to_string()
    };
    let parsed: serde_json::Value = serde_json::from_str(&raw)
        .map_err(|e| format!("--editor-context is not valid JSON: {e}"))?;
    if !parsed.is_object() {
        return Err("--editor-context must be a JSON object".to_string());
    }
    let ctx: EditorContext = serde_json::from_value(parsed)
        .map_err(|e| format!("--editor-context shape mismatch: {e}"))?;
    Ok(ctx)
}

fn usage_error(msg: impl Into<String>) -> RunResult {
    RunResult {
        exit_code: EXIT_USAGE,
        stdout: String::new(),
        stderr: format!("error: {}\n", msg.into()),
    }
}
