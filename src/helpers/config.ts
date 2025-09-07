import { defineConfigObject } from 'reactive-vscode'

import type { NestedScopedConfigs } from '@/generated/meta'
import { scopedConfigs } from '@/generated/meta'

// 使用 vscode-ext-gen 生成的类型定义，忽略 remoteResources 类型并通过 & 声明
export const config = defineConfigObject<NestedScopedConfigs & {
  remoteResources: { url: string, project?: string } | null
}>(
  scopedConfigs.scope,
  scopedConfigs.defaults,
)

export function getExtensionLocalResources() {
  const localResources = config.resources

  return (localResources || []).map((resource) => ({
    ...resource,
    type: 'local' as const,
  }))
}
