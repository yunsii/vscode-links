import type { BaseLinkResource } from '@/helpers/schemas'

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
      url: repoUrl,
      title: 'GitHub Repo',
    },
    {
      url: `${repoUrl}/branches`,
      title: 'GitHub Repo Branches',
    },
    {
      url: `${repoUrl}/tags`,
      title: 'GitHub Repo Tags',
    },
    {
      url: `${repoUrl}/pulls`,
      title: 'GitHub Repo MR/PR',
    },
    {
      url: `${repoUrl}/releases`,
      title: 'GitHub Repo Releases',
    },
    {
      url: `${repoUrl}/settings`,
      title: 'GitHub Repo Settings',
    },
    {
      url: `${repoUrl}/issues`,
      title: 'GitHub Repo Issues',
    },
    {
      url: `${origin}/settings`,
      title: 'GitHub User Settings',
    },
    {
      url: `${repoUrl}/settings/keys`,
      title: 'GitHub User SSH and GPG Keys',
    },
  ]

  return result
}

export function getGitHubFileUrl(owner: string, repo: string, branch: string, filePath: string) {
  const { repoUrl } = getGitHubRepoBaseUrls(owner, repo)
  const fileUrl = encodeURI(`${repoUrl}/blob/${branch}/${filePath}`)
  return fileUrl
}
