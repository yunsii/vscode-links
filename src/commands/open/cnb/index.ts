import { getCurrentRepoUrl } from '../../../helpers/git'
import { getCurrentWorkspace } from '../../../helpers/workspaces'
import { logger } from '../../../utils'
import { getErrorMessage } from '../../../helpers/errors'

import { getCnbRepoLinks, parseCnbRepoUrl } from './helpers'

export async function getCnbRepoResources() {
  try {
    const currentWorkSpace = await getCurrentWorkspace()
    const repoUrl = await getCurrentRepoUrl(currentWorkSpace)

    const { repo, groups } = parseCnbRepoUrl(repoUrl)
    logger.info('Parsed CNB repo', JSON.stringify({ repo, groups }))

    return getCnbRepoLinks(groups, repo)
  } catch (err) {
    logger.error(getErrorMessage(err))
  }
  return []
}
