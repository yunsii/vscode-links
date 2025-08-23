import * as z from 'zod/v4'

export const baseLinkResourceSchema = z.object({
  url: z.url(),
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
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
