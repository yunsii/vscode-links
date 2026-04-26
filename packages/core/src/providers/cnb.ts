import type { BaseLinkResource } from '../schemas'

export function ensureCnbRepoUrl(repoUrl?: string | null): repoUrl is string {
  if (!repoUrl) {
    return false
  }

  if (!['https://cnb.cool/'].some((item) => repoUrl.startsWith(item))) {
    return false
  }

  return !!repoUrl.length
}

/**
 * Input examples:
 *
 * - https://cnb.cool/group/repo.git
 */
export function parseCnbRepoUrl(repoUrl: string) {
  const [repo, ...reverseGroups] = repoUrl
    .replace('https://cnb.cool/', '')
    .replace('.git', '')
    .split(/\//)
    .reverse()

  return {
    repo,
    groups: reverseGroups.reverse(),
  }
}

export function getCnbRepoBaseUrls(groups: string[], repo: string) {
  const origin = `https://cnb.cool`
  const mainGroup = groups[0]
  const mainGroupUrl = `${origin}/${mainGroup}`
  const subGroupsUrls = groups.slice(1).map((item, index) => {
    return `${origin}/${groups.slice(0, index + 2).join('/')}`
  })
  const currentGroupUrl = subGroupsUrls[subGroupsUrls.length - 1] || mainGroupUrl
  const repoUrl = `${currentGroupUrl}/${repo}`
  return {
    origin,
    mainGroupUrl,
    currentGroupUrl,
    repoUrl,
  }
}

export function getCnbRepoLinks(groups: string[], repo: string) {
  const { origin, repoUrl } = getCnbRepoBaseUrls(groups, repo)
  const result: BaseLinkResource[] = [
    {
      url: `${repoUrl}/-/blob/{{git.branch}}/{{workspace.fileRelativePath}}`,
      title: 'CNB Repo Current File',
      type: 'detected',
    },
    {
      url: `${repoUrl}/-/tree/{{git.branch}}`,
      title: 'CNB Repo Current Branch',
      type: 'detected',
    },
    {
      url: repoUrl,
      title: 'CNB Repo',
      type: 'detected',
    },
    {
      url: `${repoUrl}/-/branches`,
      title: 'CNB Repo Branches',
      type: 'detected',
    },
    {
      url: `${repoUrl}/-/tags`,
      title: 'CNB Repo Tags',
      type: 'detected',
    },
    {
      url: `${repoUrl}/-/pulls`,
      title: 'CNB Repo MR/PR',
      type: 'detected',
    },
    {
      url: `${repoUrl}/-/releases`,
      title: 'CNB Repo Releases',
      type: 'detected',
    },
    {
      url: `${repoUrl}/-/settings`,
      title: 'CNB Repo Settings',
      type: 'detected',
    },
    {
      url: `${repoUrl}/-/issues`,
      title: 'CNB Repo Issues',
      type: 'detected',
    },
    {
      url: `${origin}/profile`,
      title: 'CNB User Settings/Profile',
      type: 'detected',
    },
    {
      url: `${origin}/profile/token`,
      title: 'CNB User Access Tokens',
      type: 'detected',
    },
  ]

  return result
}

export function getCnbCurrentBranchUrl(groups: string[], repo: string, branch: string) {
  const { repoUrl } = getCnbRepoBaseUrls(groups, repo)
  const result = encodeURI(`${repoUrl}/-/tree/${branch}`)
  return result
}

export function getCnbCurrentFileUrl(groups: string[], repo: string, branch: string, filePath: string) {
  const { repoUrl } = getCnbRepoBaseUrls(groups, repo)
  const result = encodeURI(`${repoUrl}/-/blob/${branch}/${filePath}`)
  return result
}
