import { getCurrentRepoUrl } from '../../../helpers/git'
import { getCurrentWorkspace } from '../../../helpers/workspaces'
import { logger } from '../../../utils'
import { getErrorMessage } from '../../../helpers/errors'

import { getCodingRepoLinks, parseCodingRepoUrl } from './helpers'

export async function getCodingRepoResources() {
  try {
    const currentWorkSpace = await getCurrentWorkspace()
    const repoUrl = await getCurrentRepoUrl(currentWorkSpace)

    const { repo, project, team } = parseCodingRepoUrl(repoUrl)
    logger.info('Parsed CODING repo', JSON.stringify({ repo, project, team }))

    return getCodingRepoLinks(team, project, repo)
  } catch (err) {
    logger.error(getErrorMessage(err))
  }
  return []
}
