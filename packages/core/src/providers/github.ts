import type { BaseLinkResource } from '../schemas'

export function ensureGitHubRepoUrl(repoUrl?: string | null): repoUrl is string {
  if (!repoUrl) {
    return false
  }

  if (!['git@github.com:', 'https://github.com/'].some((item) => repoUrl.startsWith(item))) {
    return false
  }

  return true
}

/**
 * Input examples:
 *
 * - git@github.com:owner/repo.git
 * - https://github.com/owner/repo.git
 */
export function parseGitHubRepoUrl(repoUrl: string) {
  const [repo, owner] = repoUrl
    .replace('.git', '')
    .split(/\/|:/)
    .reverse()

  return {
    repo,
    owner,
  }
}

export function getGitHubRepoBaseUrls(owner: string, repo: string) {
  const origin = `https://github.com`
  const repoUrl = `${origin}/${owner}/${repo}`

  return {
    origin,
    repoUrl,
  }
}

export function getGitHubRepoLinks(owner: string, repo: string) {
  const { origin, repoUrl } = getGitHubRepoBaseUrls(owner, repo)

  const result: BaseLinkResource[] = [
    {
      url: `${repoUrl}/blob/{{git.branch}}/{{workspace.fileRelativePath}}`,
      title: 'GitHub Repo Current File',
      type: 'detected',
    },
    {
      url: `${repoUrl}/tree/{{git.branch}}`,
      title: 'GitHub Repo Current Branch',
      type: 'detected',
    },
    {
      url: repoUrl,
      title: 'GitHub Repo',
      type: 'detected',
    },
    {
      url: `${repoUrl}/branches`,
      title: 'GitHub Repo Branches',
      type: 'detected',
    },
    {
      url: `${repoUrl}/tags`,
      title: 'GitHub Repo Tags',
      type: 'detected',
    },
    {
      url: `${repoUrl}/pulls`,
      title: 'GitHub Repo MR/PR',
      type: 'detected',
    },
    {
      url: `${repoUrl}/releases`,
      title: 'GitHub Repo Releases',
      type: 'detected',
    },
    {
      url: `${repoUrl}/settings`,
      title: 'GitHub Repo Settings',
      type: 'detected',
    },
    {
      url: `${repoUrl}/issues`,
      title: 'GitHub Repo Issues',
      type: 'detected',
    },
    {
      url: `${origin}/settings`,
      title: 'GitHub User Settings',
      type: 'detected',
    },
    {
      url: `${repoUrl}/settings/keys`,
      title: 'GitHub User SSH and GPG Keys',
      type: 'detected',
    },
  ]

  return result
}

export function getGitHubCurrentBranchUrl(owner: string, repo: string, branch: string) {
  const { repoUrl } = getGitHubRepoBaseUrls(owner, repo)
  const result = encodeURI(`${repoUrl}/tree/${branch}`)
  return result
}

export function getGitHubCurrentFileUrl(owner: string, repo: string, branch: string, filePath: string) {
  const { repoUrl } = getGitHubRepoBaseUrls(owner, repo)
  const result = encodeURI(`${repoUrl}/blob/${branch}/${filePath}`)
  return result
}
