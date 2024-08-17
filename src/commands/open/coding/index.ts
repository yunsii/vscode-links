import { getCurrentRepoUrl } from '../../../helpers/git'

import { getCodingRepoLinks, parseCodingRepoUrl } from './helpers'

export async function getCodingRepoResources() {
  const repoUrl = await getCurrentRepoUrl()

  const { repo, project, team } = parseCodingRepoUrl(repoUrl)

  return getCodingRepoLinks(team, project, repo)
}
