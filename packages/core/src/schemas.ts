import type { TupleToUnion } from 'type-fest'

const linkResourceTypes = ['local', 'detected', 'remote-project', 'remote-shared'] as const
export type LinkResourceType = TupleToUnion<typeof linkResourceTypes>

export interface BaseLinkResource {
  url: string
  title: string
  description?: string
  type: LinkResourceType
  meta?: Record<string, unknown>
}

export interface RemoteLinkResource extends BaseLinkResource {
  project: string
}
