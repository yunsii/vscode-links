use crate::schemas::{BaseLinkResource, LinkResourceType};

const PREFIX: &str = "https://cnb.cool/";

pub fn ensure_cnb_repo_url(repo_url: &str) -> bool {
    !repo_url.is_empty() && repo_url.starts_with(PREFIX)
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CnbParse {
    pub repo: String,
    pub groups: Vec<String>,
}

/// Mirrors the TS `parseCnbRepoUrl`: drop the host prefix and any
/// trailing `.git`, then split on `/`. The last segment is the repo,
/// the rest are the (possibly nested) groups in order.
///
/// Input example: `https://cnb.cool/group/sub/repo.git`.
pub fn parse_cnb_repo_url(repo_url: &str) -> CnbParse {
    let stripped = repo_url
        .replacen(PREFIX, "", 1)
        .replace(".git", "");
    let mut parts: Vec<String> = stripped.split('/').map(String::from).collect();
    let repo = parts.pop().unwrap_or_default();
    CnbParse {
        repo,
        groups: parts,
    }
}

#[derive(Debug, Clone)]
pub struct CnbBaseUrls {
    pub origin: String,
    pub main_group_url: String,
    pub current_group_url: String,
    pub repo_url: String,
}

pub fn get_cnb_repo_base_urls(groups: &[String], repo: &str) -> CnbBaseUrls {
    let origin = "https://cnb.cool".to_string();
    let main_group = groups.first().cloned().unwrap_or_default();
    let main_group_url = format!("{origin}/{main_group}");

    let mut current_group_url = main_group_url.clone();
    for i in 1..groups.len() {
        let joined = groups[..=i].join("/");
        current_group_url = format!("{origin}/{joined}");
    }
    let repo_url = format!("{current_group_url}/{repo}");

    CnbBaseUrls {
        origin,
        main_group_url,
        current_group_url,
        repo_url,
    }
}

pub fn get_cnb_repo_links(groups: &[String], repo: &str) -> Vec<BaseLinkResource> {
    let CnbBaseUrls { origin, repo_url, .. } = get_cnb_repo_base_urls(groups, repo);
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
            format!("{repo_url}/-/blob/{{{{git.branch}}}}/{{{{workspace.fileRelativePath}}}}"),
            "CNB Repo Current File"
        ),
        row!(format!("{repo_url}/-/tree/{{{{git.branch}}}}"), "CNB Repo Current Branch"),
        row!(repo_url.clone(), "CNB Repo"),
        row!(format!("{repo_url}/-/branches"), "CNB Repo Branches"),
        row!(format!("{repo_url}/-/tags"), "CNB Repo Tags"),
        row!(format!("{repo_url}/-/pulls"), "CNB Repo MR/PR"),
        row!(format!("{repo_url}/-/releases"), "CNB Repo Releases"),
        row!(format!("{repo_url}/-/settings"), "CNB Repo Settings"),
        row!(format!("{repo_url}/-/issues"), "CNB Repo Issues"),
        row!(format!("{origin}/profile"), "CNB User Settings/Profile"),
        row!(format!("{origin}/profile/token"), "CNB User Access Tokens"),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_cnb_repo_url_single_group() {
        let p = parse_cnb_repo_url("https://cnb.cool/group/repo.git");
        assert_eq!(p.repo, "repo");
        assert_eq!(p.groups, vec!["group".to_string()]);
    }

    #[test]
    fn parse_cnb_repo_url_nested_groups() {
        let p = parse_cnb_repo_url("https://cnb.cool/g/sg/repo.git");
        assert_eq!(p.repo, "repo");
        assert_eq!(p.groups, vec!["g".to_string(), "sg".to_string()]);
    }

    #[test]
    fn ensure_cnb_repo_url_true_for_cnb_urls_only() {
        assert!(ensure_cnb_repo_url("https://cnb.cool/g/r.git"));
        assert!(!ensure_cnb_repo_url("https://github.com/g/r.git"));
        assert!(!ensure_cnb_repo_url(""));
    }

    #[test]
    fn get_cnb_repo_links_count_matches_ts() {
        let groups = vec!["g".to_string()];
        let links = get_cnb_repo_links(&groups, "r");
        assert_eq!(links.len(), 11);
    }
}
