import type { JsonObject } from 'type-fest'

export type TemplateContextFragment = JsonObject

export type TemplateContext = JsonObject & { _raw?: Record<string, TemplateContextFragment> }

export interface BuildContextOptions {
  workspacePath?: string
  repoUrl?: string | null
  /**
   * Caller-provided file path of "the currently open file", relative to the
   * workspace root. The editor (VSIX) fills this from its workspace API; CLI
   * callers fill it from `--editor-context`. When omitted/null no file-aware
   * variables are available.
   */
  fileRelativePath?: string | null
}

export interface TemplateProvider {
  id: string
  // optional fast match before expensive getContext
  match?: (repoUrl?: string) => boolean
  getContext: (options: BuildContextOptions) => Promise<TemplateContextFragment>
}
