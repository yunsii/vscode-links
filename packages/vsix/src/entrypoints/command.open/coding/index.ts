import { getCurrentRepoUrl } from '@/helpers/git'
import { getCurrentWorkspace } from '@/helpers/workspaces'
import { logger } from '@/utils'

import { ensureCodingRepoUrl, getCodingRepoLinks, parseCodingRepoUrl } from './helpers'

export async function getCodingRepoResources(onError: (err: unknown) => void) {
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
    return result
  } catch (err) {
    onError(err)
  }
  return []
}
