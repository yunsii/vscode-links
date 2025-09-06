import { getCurrentBranch, getCurrentRepoUrl } from '@/helpers/git'
import type { BaseLinkResource } from '@/helpers/schemas'
import { getCurrentFileRelativePath, getCurrentWorkspace } from '@/helpers/workspaces'
import { logger } from '@/utils'

import { ensureGitHubRepoUrl, getGitHubFileUrl, getGitHubRepoLinks, parseGitHubRepoUrl } from './helpers'

export async function getGithubRepoResources(onError: (err: unknown) => void) {
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
      const currentFileLink: BaseLinkResource = {
        url: getGitHubFileUrl(owner, repo, currentBranch, currentFileRelativePath),
        title: 'GitHub Repo Current File',
        type: 'detected',
      }
      return [...result, currentFileLink]
    }
    return result
  } catch (err) {
    onError(err)
  }
  return []
}
