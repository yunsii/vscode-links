import { getErrorMessage } from '@/helpers/errors'
import { getCurrentBranch, getCurrentRepoUrl } from '@/helpers/git'
import type { BaseLinkResource } from '@/helpers/schemas'
import { getCurrentFileRelativePath, getCurrentWorkspace } from '@/helpers/workspaces'
import { logger } from '@/utils'

import { ensureCnbRepoUrl, getCnbFileUrl, getCnbRepoLinks, parseCnbRepoUrl } from './helpers'

export async function getCnbRepoResources() {
  try {
    const currentWorkSpace = await getCurrentWorkspace()
    const repoUrl = await getCurrentRepoUrl(currentWorkSpace)

    if (!ensureCnbRepoUrl(repoUrl)) {
      throw new Error(`Current repo url is not a valid CNB repo url: ${repoUrl}`)
    }
    logger.info('Current repo url', repoUrl)

    const { repo, groups } = parseCnbRepoUrl(repoUrl)
    logger.info('Parsed CNB repo', JSON.stringify({ repo, groups }))

    const result = getCnbRepoLinks(groups, repo)

    const currentBranch = await getCurrentBranch(currentWorkSpace)
    const currentFileRelativePath = await getCurrentFileRelativePath()

    if (currentFileRelativePath) {
      const currentFileLink: BaseLinkResource = {
        url: getCnbFileUrl(groups, repo, currentBranch, currentFileRelativePath),
        title: 'CNB Repo Current File',
      }
      return [...result, currentFileLink]
    }
    return result
  } catch (err) {
    logger.error(getErrorMessage(err))
  }
  return []
}
