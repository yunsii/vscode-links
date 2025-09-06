import * as z from 'zod/v4'

import type { TupleToUnion } from 'type-fest'

const linkResourceTypes = ['local', 'detected', 'remote-project', 'remote-shared'] as const
export type LinkResourceType = TupleToUnion<typeof linkResourceTypes>

export const baseLinkResourceSchema = z.object({
  url: z.url(),
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(linkResourceTypes).default('local'),
  meta: z.record(z.string(), z.unknown()).optional(),
})
export const baseLinksResourcesSchema = z.array(baseLinkResourceSchema)

export type BaseLinkResource = z.infer<typeof baseLinkResourceSchema>
export type BaseLinksResources = z.infer<typeof baseLinksResourcesSchema>

export const remoteLinkResourceSchema = baseLinkResourceSchema.safeExtend({
  project: z.string().min(2).max(100),
})
export const remoteLinksResourcesSchema = z.array(remoteLinkResourceSchema)

export type RemoteLinkResource = z.infer<typeof remoteLinkResourceSchema>
export type RemoteLinksResources = z.infer<typeof remoteLinksResourcesSchema>
