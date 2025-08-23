import { sortBy } from 'es-toolkit'

import { getExtensionRemoteResourcesConfig, getRemoteTitlePrefix, getSharedTitlePrefix } from '@/helpers/config'
import { getLinksResourcesFromRemoteCsv } from '@/helpers/csv'

const SHARED_PROJECT = '#shared-links'

export async function getRemoteResources(onError: (err: unknown) => void) {
  const remoteResourcesConfig = getExtensionRemoteResourcesConfig()
  if (!remoteResourcesConfig) {
    return []
  }
  try {
    const remoteLinksResources = await getLinksResourcesFromRemoteCsv(remoteResourcesConfig.url)
    const sharedPrefix = getSharedTitlePrefix()
    const remotePrefix = getRemoteTitlePrefix()

    return sortBy(remoteLinksResources.data, ['project'])
      .filter((resource) => {
        return [SHARED_PROJECT, remoteResourcesConfig.project].includes(resource.project)
      })
      .map((resource) => {
        if (resource.project === SHARED_PROJECT) {
          return { ...resource, title: `${sharedPrefix}${resource.title}` }
        }
        // 如果是当前远程配置的 project，则标记为 remote
        if (resource.project === remoteResourcesConfig.project) {
          return { ...resource, title: `${remotePrefix}${resource.title}` }
        }
        return resource
      })
  } catch (error) {
    onError(error)
  }
  return []
}
