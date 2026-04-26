import { getCurrentRepoUrl } from '@/helpers/git'
import { getCurrentWorkspace } from '@/helpers/workspaces'
import { logger } from '@/utils'

import { ensureCnbRepoUrl, getCnbRepoLinks, parseCnbRepoUrl } from './helpers'

export async function getCnbRepoResources(onError: (err: unknown) => void) {
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
    return result
  } catch (err) {
    onError(err)
  }
  return []
}
