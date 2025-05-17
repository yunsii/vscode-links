import type { ResourceItem } from '../../../helpers/config'

/**
 * Input examples:
 *
 * - git@github.com:owner/repo.git
 * - https://github.com/owner/repo.git
 */
export function parseGitHubRepoUrl(repoUrl: string) {
  if (!repoUrl) {
    throw new Error('Unexpected falsy repo url')
  }

  if (!['git@github.com:', 'https://github.com/'].some((item) => repoUrl.startsWith(item))) {
    throw new Error('Unexpected GitHub repo url')
  }

  const [repo, owner] = repoUrl
    .replace('.git', '')
    .split(/\/|:/)
    .reverse()

  return {
    repo,
    owner,
  }
}

export async function getGitHubRepoLinks(owner: string, repo: string) {
  const origin = `https://github.com`
  const repoUrl = `${origin}/${owner}/${repo}`
  const result: ResourceItem[] = [
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
