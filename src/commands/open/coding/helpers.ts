import type { ResourceItem } from '../../../helpers/config'

export async function getCodingRepoLinks(project: string, repoName: string) {
  const projectUrl = `https://duiyun.coding.net/p/${project}`
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
  ]

  return result
}
