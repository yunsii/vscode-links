use crate::schemas::{BaseLinkResource, LinkResourceType};

const PREFIXES: &[&str] = &["git@github.com:", "https://github.com/"];

pub fn ensure_github_repo_url(repo_url: &str) -> bool {
    if repo_url.is_empty() {
        return false;
    }
    PREFIXES.iter().any(|p| repo_url.starts_with(p))
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GitHubParse {
    pub owner: String,
    pub repo: String,
}

/// Mirrors the TS `parseGitHubRepoUrl`: take everything after the host,
/// strip a trailing `.git`, then read the last two segments after a `/`
/// or `:` split.
///
/// Inputs:
///   - `git@github.com:owner/repo.git`
///   - `https://github.com/owner/repo.git`
pub fn parse_github_repo_url(repo_url: &str) -> GitHubParse {
    let stripped = repo_url.replace(".git", "");
    let mut parts: Vec<&str> = stripped.split(|c| c == '/' || c == ':').collect();
    let repo = parts.pop().unwrap_or("").to_string();
    let owner = parts.pop().unwrap_or("").to_string();
    GitHubParse { owner, repo }
}

#[derive(Debug, Clone)]
pub struct GitHubBaseUrls {
    pub origin: String,
    pub repo_url: String,
}

pub fn get_github_repo_base_urls(owner: &str, repo: &str) -> GitHubBaseUrls {
    let origin = "https://github.com".to_string();
    let repo_url = format!("{origin}/{owner}/{repo}");
    GitHubBaseUrls { origin, repo_url }
}

pub fn get_github_repo_links(owner: &str, repo: &str) -> Vec<BaseLinkResource> {
    let GitHubBaseUrls { origin, repo_url } = get_github_repo_base_urls(owner, repo);
    let detected = LinkResourceType::Detected;

    macro_rules! row {
        ($url:expr, $title:literal) => {
            BaseLinkResource {
                url: $url,
                title: $title.to_string(),
                description: None,
                r#type: detected,
                meta: None,
            }
        };
    }

    vec![
        row!(
            format!("{repo_url}/blob/{{{{git.branch}}}}/{{{{workspace.fileRelativePath}}}}"),
            "GitHub Repo Current File"
        ),
        row!(format!("{repo_url}/tree/{{{{git.branch}}}}"), "GitHub Repo Current Branch"),
        row!(repo_url.clone(), "GitHub Repo"),
        row!(format!("{repo_url}/branches"), "GitHub Repo Branches"),
        row!(format!("{repo_url}/tags"), "GitHub Repo Tags"),
        row!(format!("{repo_url}/pulls"), "GitHub Repo MR/PR"),
        row!(format!("{repo_url}/releases"), "GitHub Repo Releases"),
        row!(format!("{repo_url}/settings"), "GitHub Repo Settings"),
        row!(format!("{repo_url}/issues"), "GitHub Repo Issues"),
        row!(format!("{origin}/settings"), "GitHub User Settings"),
        row!(format!("{repo_url}/settings/keys"), "GitHub User SSH and GPG Keys"),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_github_repo_url_https() {
        let p = parse_github_repo_url("https://github.com/owner/repo.git");
        assert_eq!(p.owner, "owner");
        assert_eq!(p.repo, "repo");
    }

    #[test]
    fn parse_github_repo_url_ssh() {
        let p = parse_github_repo_url("git@github.com:owner/repo.git");
        assert_eq!(p.owner, "owner");
        assert_eq!(p.repo, "repo");
    }

    #[test]
    fn ensure_github_repo_url_true_for_known_prefixes() {
        assert!(ensure_github_repo_url("https://github.com/o/r.git"));
        assert!(ensure_github_repo_url("git@github.com:o/r.git"));
    }

    #[test]
    fn ensure_github_repo_url_false_otherwise() {
        assert!(!ensure_github_repo_url(""));
        assert!(!ensure_github_repo_url("https://gitlab.com/o/r.git"));
        assert!(!ensure_github_repo_url("https://cnb.cool/o/r.git"));
    }
}
