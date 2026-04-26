use std::path::Path;
use std::process::Command;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum GitError {
    #[error("git command failed: {0}")]
    Spawn(#[from] std::io::Error),
}

/// `git -C <cwd> remote get-url origin`. Returns the configured URL of
/// `origin` (a string with a trailing newline trimmed), or `None` when
/// `origin` is unset, the directory is not a git repository, or git
/// otherwise refuses to answer (e.g. shallow clone with a missing
/// remote, etc.). Spawn failures (git not on PATH) propagate as Err.
pub fn get_current_repo_url(cwd: &Path) -> Result<Option<String>, GitError> {
    run_git(cwd, &["remote", "get-url", "origin"])
}

/// `git -C <cwd> symbolic-ref --short HEAD`. Returns the short branch
/// name, or `None` for detached HEAD / non-git directory.
pub fn get_current_branch(cwd: &Path) -> Result<Option<String>, GitError> {
    run_git(cwd, &["symbolic-ref", "--short", "HEAD"])
}

fn run_git(cwd: &Path, args: &[&str]) -> Result<Option<String>, GitError> {
    let output = Command::new("git").arg("-C").arg(cwd).args(args).output()?;
    // We deliberately treat *any* non-zero exit as "no value available
    // here" rather than failing hard. The two real-world causes are:
    //   - the cwd is not a git repository, or
    //   - the working tree is in a detached state (CI checkouts hit
    //     this often), an unborn branch, or has no `origin` remote.
    // None of those should crash the caller; resolve() degrades
    // gracefully when either path returns None.
    if !output.status.success() {
        return Ok(None);
    }
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if stdout.is_empty() {
        Ok(None)
    } else {
        Ok(Some(stdout))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn get_current_repo_url_in_this_repo() {
        // Local checkout has an origin; CI's actions/checkout shallow
        // clone also configures origin. Either way, this returns Some.
        let url = get_current_repo_url(Path::new(".")).unwrap().unwrap();
        assert!(url.contains("vscode-links"), "got {url:?}");
    }

    #[test]
    fn get_current_branch_does_not_panic_in_this_repo() {
        // In a regular checkout this is `Some(branch)`; in CI's
        // detached-HEAD checkout it is `None`. Both are valid.
        let _ = get_current_branch(Path::new(".")).unwrap();
    }

    #[test]
    fn get_current_repo_url_outside_a_repo_returns_none() {
        let tmp = std::env::temp_dir();
        let v = get_current_repo_url(&tmp).unwrap();
        assert!(v.is_none(), "expected None, got {v:?}");
    }
}
