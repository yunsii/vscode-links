import { logger } from '../utils'

export async function getCurrentRepoUrl(cwd: string) {
  const { default: gitRemoteOriginUrl } = await import('git-remote-origin-url')
  const url = await gitRemoteOriginUrl({ cwd })
  logger.info('Current repo url', url)
  return url
}
