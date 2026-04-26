import { defineConfigObject } from 'reactive-vscode'

import type { NestedScopedConfigs } from '@/generated/meta'
import { scopedConfigs } from '@/generated/meta'

// vscode-ext-gen does not infer the `links.remoteResources` type because the
// schema uses `oneOf`; declare it inline so reactive-vscode types it correctly.
export const config = defineConfigObject<NestedScopedConfigs & {
  remoteResources: { url: string, project?: string } | null
}>(
  scopedConfigs.scope,
  scopedConfigs.defaults,
)
