import type { ResourceItem } from '../../../helpers/config'

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
  const result: ResourceItem[] = [
    {
      url: repoUrl,
      title: 'CNB Repo',
    },
    {
      url: `${repoUrl}/-/branches`,
      title: 'CNB Repo Branches',
    },
    {
      url: `${repoUrl}/-/tags`,
      title: 'CNB Repo Tags',
    },
    {
      url: `${repoUrl}/-/pulls`,
      title: 'CNB Repo MR/PR',
    },
    {
      url: `${repoUrl}/-/releases`,
      title: 'CNB Repo Releases',
    },
    {
      url: `${repoUrl}/-/settings`,
      title: 'CNB Repo Settings',
    },
    {
      url: `${repoUrl}/-/issues`,
      title: 'CNB Repo Issues',
    },
    {
      url: `${origin}/profile`,
      title: 'CNB User Settings/Profile',
    },
    {
      url: `${origin}/profile/token`,
      title: 'CNB User Access Tokens',
    },
  ]

  return result
}

export function getCnbFileUrl(groups: string[], repo: string, branch: string, filePath: string) {
  const { repoUrl } = getCnbRepoBaseUrls(groups, repo)
  const fileUrl = encodeURI(`${repoUrl}/-/blob/${branch}/${filePath}`)
  return fileUrl
}
