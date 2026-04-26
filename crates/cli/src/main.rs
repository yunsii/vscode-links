use std::io::Write;
use std::process::ExitCode;

use vscode_links_cli::run;

fn main() -> ExitCode {
    let argv: Vec<String> = std::env::args().skip(1).collect();
    let result = run(&argv);
    if !result.stdout.is_empty() {
        let _ = std::io::stdout().write_all(result.stdout.as_bytes());
    }
    if !result.stderr.is_empty() {
        let _ = std::io::stderr().write_all(result.stderr.as_bytes());
    }
    ExitCode::from(result.exit_code)
}
