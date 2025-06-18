import { getErrorMessage } from '../../../helpers/errors'
import { getCurrentBranch, getCurrentRepoUrl } from '../../../helpers/git'
import { getCurrentFileRelativePath, getCurrentWorkspace } from '../../../helpers/workspaces'
import { logger } from '../../../utils'
import { ensureCodingRepoUrl, getCodingFileUrl, getCodingRepoLinks, parseCodingRepoUrl } from './helpers'

import type { ResourceItem } from '../../../helpers/config'

export async function getCodingRepoResources() {
  try {
    const currentWorkSpace = await getCurrentWorkspace()
    const repoUrl = await getCurrentRepoUrl(currentWorkSpace)

    if (!ensureCodingRepoUrl(repoUrl)) {
      throw new Error(`Current repo url is not a valid CODING repo url: ${repoUrl}`)
    }
    logger.info('Current repo url', repoUrl)

    const { repo, project, team } = parseCodingRepoUrl(repoUrl)
    logger.info('Parsed CODING repo', JSON.stringify({ repo, project, team }))

    const result = getCodingRepoLinks(team, project, repo)

    const currentBranch = await getCurrentBranch(currentWorkSpace)
    const currentFileRelativePath = await getCurrentFileRelativePath()
    logger.info('Current file relative path', currentFileRelativePath)

    if (currentFileRelativePath) {
      const currentFileLink: ResourceItem = {
        url: getCodingFileUrl(team, project, repo, currentBranch, currentFileRelativePath),
        title: 'GitHub Repo Current File',
      }
      return [...result, currentFileLink]
    }
    return result
  } catch (err) {
    logger.error(getErrorMessage(err))
  }
  return []
}
