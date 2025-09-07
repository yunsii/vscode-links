import type { BaseLinkResource } from '@/helpers/schemas'

export function ensureCodingRepoUrl(repoUrl?: string | null): repoUrl is string {
  if (!repoUrl) {
    return false
  }

  if (!['git@e.coding.net:', 'https://e.coding.net/'].some((item) => repoUrl.startsWith(item))) {
    return false
  }

  return true
}

/**
 * Input examples:
 *
 * - git@e.coding.net:team/project/repo.git
 * - https://e.coding.net/team/project/repo.git
 */
export function parseCodingRepoUrl(repoUrl: string) {
  if (!repoUrl) {
    throw new Error('Unexpected falsy repo url')
  }

  if (!['git@e.coding.net:', 'https://e.coding.net/'].some((item) => repoUrl.startsWith(item))) {
    throw new Error('Unexpected CODING repo url')
  }

  const [repo, project, team] = repoUrl.replace('.git', '').split(/\/|:/).reverse()

  return {
    repo,
    project,
    team,
  }
}

export function getCodingRepoBaseUrls(team: string, project: string, repo: string) {
  const teamUrl = `https://${team}.coding.net`
  const projectUrl = `${teamUrl}/p/${project}`
  const repoUrl = `${projectUrl}/d/${repo}/git`

  return {
    teamUrl,
    projectUrl,
    repoUrl,
  }
}

export function getCodingRepoLinks(team: string, project: string, repo: string) {
  const { projectUrl, repoUrl } = getCodingRepoBaseUrls(team, project, repo)
  const result: BaseLinkResource[] = [
    {
      url: repoUrl,
      title: 'CODING Repo',
      type: 'detected',
    },
    {
      url: `${repoUrl}/branches`,
      title: 'CODING Repo Branches',
      type: 'detected',
    },
    {
      url: `${repoUrl}/tags`,
      title: 'CODING Repo Tags',
      type: 'detected',
    },
    {
      url: `${repoUrl}/merges`,
      title: 'CODING Repo MR/PR',
      type: 'detected',
    },
    {
      url: `${repoUrl}/releases`,
      title: 'CODING Repo Releases',
      type: 'detected',
    },
    {
      url: `${repoUrl}/settings`,
      title: 'CODING Repo Settings',
      type: 'detected',
    },
    {
      url: `${projectUrl}/all/issues`,
      title: 'CODING Project Issues',
      type: 'detected',
    },
    {
      url: `${projectUrl}/ci/job`,
      title: 'CODING Project CI',
      type: 'detected',
    },
    {
      url: `${repoUrl}/user/account/setting/basic`,
      title: 'CODING Member Profile',
      type: 'detected',
    },
    {
      url: `${repoUrl}/user/account/setting/tokens`,
      title: 'CODING Member Access Tokens',
      type: 'detected',
    },
  ]

  return result
}

export function getCodingFileUrl(team: string, project: string, repo: string, branch: string, filePath: string) {
  const { repoUrl } = getCodingRepoBaseUrls(team, project, repo)
  const fileUrl = encodeURI(`${repoUrl}/tree/${branch}/${filePath}`)
  return fileUrl
}
