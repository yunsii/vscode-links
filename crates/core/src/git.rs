use std::path::Path;
use std::process::Command;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum GitError {
    #[error("git command failed: {0}")]
    Spawn(#[from] std::io::Error),
    #[error("git exited {code} for {label}: {stderr}")]
    NonZero {
        label: &'static str,
        code: i32,
        stderr: String,
    },
}

/// `git -C <cwd> remote get-url origin`. Returns the configured URL of
/// `origin` (a string with a trailing newline trimmed), or `None` when
/// `origin` is unset or the directory is not a git repository.
pub fn get_current_repo_url(cwd: &Path) -> Result<Option<String>, GitError> {
    run_git(cwd, &["remote", "get-url", "origin"], "remote get-url origin")
}

/// `git -C <cwd> symbolic-ref --short HEAD`. Returns the short branch
/// name, or `None` for detached HEAD / non-git directory.
pub fn get_current_branch(cwd: &Path) -> Result<Option<String>, GitError> {
    run_git(cwd, &["symbolic-ref", "--short", "HEAD"], "symbolic-ref HEAD")
}

fn run_git(
    cwd: &Path,
    args: &[&str],
    label: &'static str,
) -> Result<Option<String>, GitError> {
    let output = Command::new("git").arg("-C").arg(cwd).args(args).output()?;
    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if stdout.is_empty() { Ok(None) } else { Ok(Some(stdout)) }
    } else {
        // Treat any non-zero exit as "no value here" rather than fail
        // hard, mirroring how the TS `getCurrentRepoUrl` returns
        // `undefined` outside a git checkout instead of throwing. This
        // keeps `resolve()` working in arbitrary cwds.
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let code = output.status.code().unwrap_or(-1);
        // For diagnostic builds, surface the error chain via the Err
        // variant so the caller can log it; resolve() collapses this
        // back to "no repo url".
        Err(GitError::NonZero { label, code, stderr })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn get_current_repo_url_in_this_repo() {
        // The vscode-links checkout is itself a git repo, so the live
        // command should succeed and produce a github.com URL.
        let url = get_current_repo_url(Path::new(".")).unwrap();
        assert!(url.is_some());
        let url = url.unwrap();
        assert!(url.contains("vscode-links"), "got {url:?}");
    }

    #[test]
    fn get_current_branch_in_this_repo() {
        let branch = get_current_branch(Path::new(".")).unwrap();
        assert!(branch.is_some());
    }

    #[test]
    fn get_current_repo_url_outside_a_repo_returns_err() {
        let tmp = std::env::temp_dir();
        let err = get_current_repo_url(&tmp).unwrap_err();
        assert!(matches!(err, GitError::NonZero { .. }));
    }
}
