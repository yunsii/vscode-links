import type { ResourceItem } from '../../../helpers/config'

/**
 * Input examples:
 *
 * - https://cnb.cool/group/repo.git
 */
export function parseCnbRepoUrl(repoUrl: string) {
  if (!repoUrl) {
    throw new Error('Unexpected falsy repo url')
  }

  if (!['https://cnb.cool/'].some((item) => repoUrl.startsWith(item))) {
    throw new Error('Unexpected CNB repo url')
  }

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

export async function getCnbRepoLinks(groups: string[], repo: string) {
  const origin = `https://cnb.cool`
  const mainGroup = groups[0]
  const mainGroupUrl = `${origin}/${mainGroup}`
  const subGroupsUrl = groups.slice(1).map((item, index) => {
    return `${origin}/${groups.slice(0, index + 2).join('/')}`
  })
  const currentGroupUrl = subGroupsUrl[subGroupsUrl.length - 1] || mainGroupUrl
  const repoUrl = `${currentGroupUrl}/${repo}`
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
