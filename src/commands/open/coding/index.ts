import os from 'node:os'

import { getCurrentRepoUrl } from '../../../helpers/git'
import { getCurrentWorkspace } from '../../../helpers/workspaces'
import { logger } from '../../../utils'

import { getCodingRepoLinks, parseCodingRepoUrl } from './helpers'

export async function getCodingRepoResources() {
  const currentWorkSpace = await getCurrentWorkspace()
  const repoUrl = await getCurrentRepoUrl(os.platform() === 'win32' ? `file://${currentWorkSpace}` : currentWorkSpace)

  const { repo, project, team } = parseCodingRepoUrl(repoUrl)
  logger.info('Parsed CODING repo', JSON.stringify({ repo, project, team }))

  return getCodingRepoLinks(team, project, repo)
}
