import type { JsonObject } from 'type-fest'

export type TemplateContextFragment = JsonObject

export type TemplateContext = JsonObject & { _raw?: Record<string, TemplateContextFragment> }

export interface TemplateProvider {
  id: string
  // optional fast match before expensive getContext
  match?: (repoUrl?: string) => boolean
  getContext: (options: { workspacePath?: string, repoUrl?: string | null }) => Promise<TemplateContextFragment>
}
