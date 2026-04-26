// Mirrors the JS-shape view of `vscode-links-core::resolve` and the
// strict whitelist `render_template`. Kept in sync by hand for v1; PR
// 5e will add `napi build`-generated declarations alongside the per-
// arch optional packages.

export type LinkResourceType = 'local' | 'detected' | 'remote-project' | 'remote-shared'

export interface ResolvedLink {
  type: LinkResourceType
  source: string
  url: string
  title: string
  description?: string
}

export type SkipReason =
  | 'invalid_syntax'
  | 'unknown_variable'
  | 'null_value'
  | 'fetch_failed'

export interface SkippedLink {
  source: string
  raw: {
    url: string
    title: string
    description?: string
    type: LinkResourceType
    meta?: Record<string, unknown>
  }
  reason: SkipReason
  variable?: string
  message: string
}

export interface ResolveDiagnostic {
  level: 'warn' | 'error'
  source: string
  message: string
}

export interface ResolveResult {
  context: Record<string, unknown>
  links: ResolvedLink[]
  skipped: SkippedLink[]
  diagnostics: ResolveDiagnostic[]
}

export interface LocalLinkInput {
  url: string
  title: string
  description?: string
  meta?: Record<string, unknown>
}

export interface LinksConfig {
  resources?: LocalLinkInput[]
  remoteResources?: { url: string, project?: string } | null
}

export interface EditorContext {
  fileRelativePath?: string | null
}

export interface ResolveOptions {
  cwd: string
  config?: LinksConfig
  editorContext?: EditorContext
  failSoft?: boolean
}

export function resolve(options: ResolveOptions): ResolveResult

export function renderTemplate(template: string, context: object): string
