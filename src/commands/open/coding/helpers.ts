import type { ResourceItem } from '../../../helpers/config'

export async function getCodingRepoLinks(team: string, project: string, repoName: string) {
  const teamUrl = `https://${team}.coding.net`
  const projectUrl = `${teamUrl}/p/${project}`
  const repoUrl = `${projectUrl}/d/${repoName}/git`
  const result: ResourceItem[] = [
    {
      url: repoUrl,
      title: 'CODING Repo',
    },
    {
      url: `${repoUrl}/branches`,
      title: 'CODING Repo Branches',
    },
    {
      url: `${repoUrl}/tags`,
      title: 'CODING Repo Tags',
    },
    {
      url: `${repoUrl}/merges`,
      title: 'CODING Repo MR/PR',
    },
    {
      url: `${repoUrl}/releases`,
      title: 'CODING Repo Releases',
    },
    {
      url: `${repoUrl}/settings`,
      title: 'CODING Repo Settings',
    },
    {
      url: `${projectUrl}/all/issues`,
      title: 'CODING Project Issues',
    },
    {
      url: `${projectUrl}/ci/job`,
      title: 'CODING Project CI',
    },
    {
      url: `${repoUrl}/user/account/setting/basic`,
      title: 'CODING Member Profile',
    },
    {
      url: `${repoUrl}/user/account/setting/tokens`,
      title: 'CODING Member Access Tokens',
    },
  ]

  return result
}
