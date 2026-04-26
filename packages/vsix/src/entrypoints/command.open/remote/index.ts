import { config } from '@/helpers/config'
import { getLinksResourcesFromRemoteCsv } from '@/helpers/csv'
import type { RemoteLinkResource } from '@/helpers/schemas'

const SHARED_PROJECT = '#shared-links'

export async function getRemoteResources(onError: (err: unknown) => void) {
  const remoteResourcesConfig = config.remoteResources
  if (!remoteResourcesConfig) {
    return []
  }
  try {
    const remoteLinksResources = await getLinksResourcesFromRemoteCsv(remoteResourcesConfig.url)

    const projectLinks: RemoteLinkResource[] = []
    const sharedLinks: RemoteLinkResource[] = []

    remoteLinksResources.data.forEach((resource) => {
      if (resource.project === remoteResourcesConfig.project) {
        projectLinks.push({ ...resource, title: resource.title, type: 'remote-project' as const })
      } else if (resource.project === SHARED_PROJECT) {
        sharedLinks.push({ ...resource, title: resource.title, type: 'remote-shared' as const })
      }
    })

    return [...projectLinks, ...sharedLinks]
  } catch (error) {
    onError(error)
  }
  return []
}
