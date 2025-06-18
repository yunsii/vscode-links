import { getErrorMessage } from '../../../helpers/errors'
import { getCurrentBranch, getCurrentRepoUrl } from '../../../helpers/git'
import { getCurrentFileRelativePath, getCurrentWorkspace } from '../../../helpers/workspaces'
import { logger } from '../../../utils'
import { ensureGitHubRepoUrl, getGitHubFileUrl, getGitHubRepoLinks, parseGitHubRepoUrl } from './helpers'

import type { ResourceItem } from '../../../helpers/config'

export async function getGithubRepoResources() {
  try {
    const currentWorkSpace = await getCurrentWorkspace()
    const repoUrl = await getCurrentRepoUrl(currentWorkSpace)

    if (!ensureGitHubRepoUrl(repoUrl)) {
      throw new Error(`Current repo url is not a valid GitHub repo url: ${repoUrl}`)
    }
    logger.info('Current repo url', repoUrl)

    const { repo, owner } = parseGitHubRepoUrl(repoUrl)
    logger.info('Parsed GitHub repo', JSON.stringify({ repo, owner }))

    const result = getGitHubRepoLinks(owner, repo)

    const currentBranch = await getCurrentBranch(currentWorkSpace)
    const currentFileRelativePath = await getCurrentFileRelativePath()
    logger.info('Current file relative path', currentFileRelativePath)

    if (currentFileRelativePath) {
      const currentFileLink: ResourceItem = {
        url: getGitHubFileUrl(owner, repo, currentBranch, currentFileRelativePath),
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
