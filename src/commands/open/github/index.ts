import { getErrorMessage } from '../../../helpers/errors'
import { getCurrentRepoUrl } from '../../../helpers/git'
import { getCurrentWorkspace } from '../../../helpers/workspaces'
import { logger } from '../../../utils'
import { getGitHubRepoLinks, parseGitHubRepoUrl } from './helpers'

export async function getGithubRepoResources() {
  try {
    const currentWorkSpace = await getCurrentWorkspace()
    const repoUrl = await getCurrentRepoUrl(currentWorkSpace)

    const { repo, owner } = parseGitHubRepoUrl(repoUrl)
    logger.info('Parsed CNB repo', JSON.stringify({ repo, owner }))

    return getGitHubRepoLinks(owner, repo)
  } catch (err) {
    logger.error(getErrorMessage(err))
  }
  return []
}
