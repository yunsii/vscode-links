use crate::schemas::{BaseLinkResource, LinkResourceType};

const PREFIXES: &[&str] = &["git@e.coding.net:", "https://e.coding.net/"];

pub fn ensure_coding_repo_url(repo_url: &str) -> bool {
    if repo_url.is_empty() {
        return false;
    }
    PREFIXES.iter().any(|p| repo_url.starts_with(p))
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CodingParse {
    pub team: String,
    pub project: String,
    pub repo: String,
}

#[derive(Debug, thiserror::Error)]
pub enum CodingParseError {
    #[error("Unexpected falsy repo url")]
    EmptyUrl,
    #[error("Unexpected CODING repo url")]
    NotCoding,
}

/// Mirrors the TS `parseCodingRepoUrl`: validate the host prefix, then
/// strip a trailing `.git` and read the last three segments after a
/// `/` or `:` split.
///
/// Inputs:
///   - `git@e.coding.net:team/project/repo.git`
///   - `https://e.coding.net/team/project/repo.git`
pub fn parse_coding_repo_url(repo_url: &str) -> Result<CodingParse, CodingParseError> {
    if repo_url.is_empty() {
        return Err(CodingParseError::EmptyUrl);
    }
    if !PREFIXES.iter().any(|p| repo_url.starts_with(p)) {
        return Err(CodingParseError::NotCoding);
    }
    let stripped = repo_url.replace(".git", "");
    let mut parts: Vec<&str> = stripped.split(|c| c == '/' || c == ':').collect();
    let repo = parts.pop().unwrap_or("").to_string();
    let project = parts.pop().unwrap_or("").to_string();
    let team = parts.pop().unwrap_or("").to_string();
    Ok(CodingParse { team, project, repo })
}

#[derive(Debug, Clone)]
pub struct CodingBaseUrls {
    pub team_url: String,
    pub project_url: String,
    pub repo_url: String,
}

pub fn get_coding_repo_base_urls(team: &str, project: &str, repo: &str) -> CodingBaseUrls {
    let team_url = format!("https://{team}.coding.net");
    let project_url = format!("{team_url}/p/{project}");
    let repo_url = format!("{project_url}/d/{repo}/git");
    CodingBaseUrls { team_url, project_url, repo_url }
}

pub fn get_coding_repo_links(team: &str, project: &str, repo: &str) -> Vec<BaseLinkResource> {
    let CodingBaseUrls { project_url, repo_url, .. } =
        get_coding_repo_base_urls(team, project, repo);
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
        row!(repo_url.clone(), "CODING Repo"),
        row!(format!("{repo_url}/branches"), "CODING Repo Branches"),
        row!(format!("{repo_url}/tags"), "CODING Repo Tags"),
        row!(format!("{repo_url}/merges"), "CODING Repo MR/PR"),
        row!(format!("{repo_url}/releases"), "CODING Repo Releases"),
        row!(format!("{repo_url}/settings"), "CODING Repo Settings"),
        row!(format!("{project_url}/all/issues"), "CODING Project Issues"),
        row!(format!("{project_url}/ci/job"), "CODING Project CI"),
        row!(format!("{repo_url}/user/account/setting/basic"), "CODING Member Profile"),
        row!(
            format!("{repo_url}/user/account/setting/tokens"),
            "CODING Member Access Tokens"
        ),
        row!(
            format!("{repo_url}/tree/{{{{git.branch}}}}/{{{{workspace.fileRelativePath}}}}"),
            "CODING Repo Current File"
        ),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_coding_repo_url_https() {
        let p = parse_coding_repo_url("https://e.coding.net/team/project/repo.git").unwrap();
        assert_eq!(p.team, "team");
        assert_eq!(p.project, "project");
        assert_eq!(p.repo, "repo");
    }

    #[test]
    fn parse_coding_repo_url_ssh() {
        let p = parse_coding_repo_url("git@e.coding.net:team/project/repo.git").unwrap();
        assert_eq!(p.team, "team");
        assert_eq!(p.project, "project");
        assert_eq!(p.repo, "repo");
    }

    #[test]
    fn parse_coding_repo_url_rejects_other_hosts() {
        let err = parse_coding_repo_url("https://github.com/o/r.git").unwrap_err();
        assert!(matches!(err, CodingParseError::NotCoding));
    }

    #[test]
    fn ensure_coding_repo_url_true_for_known_prefixes() {
        assert!(ensure_coding_repo_url("https://e.coding.net/t/p/r.git"));
        assert!(ensure_coding_repo_url("git@e.coding.net:t/p/r.git"));
        assert!(!ensure_coding_repo_url(""));
        assert!(!ensure_coding_repo_url("https://github.com/o/r.git"));
    }
}
