import { getCurrentRepoUrl } from '../../../helpers/git'
import { logger } from '../../../utils'

import { getCodingRepoLinks, parseCodingRepoUrl } from './helpers'

export async function getCodingRepoResources() {
  const repoUrl = await getCurrentRepoUrl()

  const { repo, project, team } = parseCodingRepoUrl(repoUrl)
  logger.info('Parsed CODING repo', JSON.stringify({ repo, project, team }))

  return getCodingRepoLinks(team, project, repo)
}
