// Single entry point that both the VSIX and the CLI call. Takes a
// caller-supplied workspace path + parsed configuration + optional editor
// context, returns a fully-rendered link list plus a separate skipped
// list for rows whose template could not be rendered against this
// context.

import { getLinksResourcesFromRemoteCsv } from './csv'
import { getCurrentRepoUrl } from './git'
import { ensureCnbRepoUrl, getCnbRepoLinks, parseCnbRepoUrl } from './providers/cnb'
import { ensureCodingRepoUrl, getCodingRepoLinks, parseCodingRepoUrl } from './providers/coding'
import { ensureGitHubRepoUrl, getGitHubRepoLinks, parseGitHubRepoUrl } from './providers/github'
import { TemplateRenderError } from './template/adapter'
import { buildContext, renderResource } from './template/engine'

import type { BaseLinkResource, LinkResourceType, RemoteLinkResource } from './schemas'
import type { TemplateRenderErrorReason } from './template/adapter'
import type { EngineLogger } from './template/engine'
import type { TemplateContext } from './template/providers/types'

const SHARED_PROJECT = '#shared-links'

/**
 * User-authored link entry. The caller (VS Code settings or
 * .vscode/settings.json) does not specify a `type`; resolve() tags
 * these as 'local' itself.
 */
export type LocalLinkInput = Omit<BaseLinkResource, 'type'>

export interface LinksConfig {
  /** Mirrors VS Code setting `links.resources`. */
  resources?: LocalLinkInput[]
  /** Mirrors VS Code setting `links.remoteResources`. */
  remoteResources?: { url: string, project?: string } | null
}

export interface ResolveOptions {
  /** Workspace / repo root path (current pane cwd for the CLI). */
  cwd: string
  /** Caller-parsed configuration (VS Code settings or .vscode/settings.json). */
  config?: LinksConfig
  /** Editor-side facts the caller can inject (file path, future: selection). */
  editorContext?: { fileRelativePath?: string | null }
  /** Optional logger, defaults to no-op. */
  logger?: EngineLogger
  /**
   * If a remote CSV cannot be fetched, return whatever else succeeded
   * and report the failure under `diagnostics` rather than throwing.
   * Defaults to true.
   */
  failSoft?: boolean
}

export interface ResolvedLink {
  type: LinkResourceType
  source: string
  url: string
  title: string
  description?: string
}

export interface SkippedLink {
  source: string
  raw: BaseLinkResource
  reason: TemplateRenderErrorReason | 'fetch_failed'
  variable?: string
  message: string
}

export interface ResolveDiagnostic {
  level: 'warn' | 'error'
  source: string
  message: string
}

export interface ResolveResult {
  context: TemplateContext
  links: ResolvedLink[]
  skipped: SkippedLink[]
  diagnostics: ResolveDiagnostic[]
}

const noopLogger: EngineLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
}

export async function resolve(options: ResolveOptions): Promise<ResolveResult> {
  const logger = options.logger ?? noopLogger
  const failSoft = options.failSoft ?? true

  const repoUrl = await tryGetRepoUrl(options.cwd, logger)

  const context = await buildContext({
    workspacePath: options.cwd,
    repoUrl,
    fileRelativePath: options.editorContext?.fileRelativePath ?? null,
    logger,
  })

  const links: ResolvedLink[] = []
  const skipped: SkippedLink[] = []
  const diagnostics: ResolveDiagnostic[] = []

  const renderInto = (source: string, raw: BaseLinkResource) => {
    try {
      const rendered = renderResource(raw, context)
      links.push({
        type: rendered.type,
        source,
        url: rendered.url,
        title: rendered.title,
        description: rendered.description,
      })
    } catch (err) {
      if (err instanceof TemplateRenderError) {
        skipped.push({
          source,
          raw,
          reason: err.reason,
          variable: err.variable,
          message: err.message,
        })
      } else {
        diagnostics.push({
          level: 'error',
          source,
          message: `unexpected render error: ${(err as Error)?.message ?? String(err)}`,
        })
      }
    }
  }

  // 1. Local (links.resources)
  for (const raw of options.config?.resources ?? []) {
    renderInto('settings:links.resources', { ...raw, type: 'local' })
  }

  // 2. Detected (per-platform from git remote)
  if (repoUrl) {
    if (ensureGitHubRepoUrl(repoUrl)) {
      const { owner, repo } = parseGitHubRepoUrl(repoUrl)
      for (const raw of getGitHubRepoLinks(owner, repo)) {
        renderInto('detected:github', raw)
      }
    } else if (ensureCnbRepoUrl(repoUrl)) {
      const { repo, groups } = parseCnbRepoUrl(repoUrl)
      for (const raw of getCnbRepoLinks(groups, repo)) {
        renderInto('detected:cnb', raw)
      }
    } else if (ensureCodingRepoUrl(repoUrl)) {
      const { team, project, repo } = parseCodingRepoUrl(repoUrl)
      for (const raw of getCodingRepoLinks(team, project, repo)) {
        renderInto('detected:coding', raw)
      }
    }
  }

  // 3. Remote CSV
  const remote = options.config?.remoteResources
  if (remote?.url) {
    try {
      const { data } = await getLinksResourcesFromRemoteCsv(remote.url)
      for (const row of data as RemoteLinkResource[]) {
        if (!row?.url) {
          continue
        }
        if (row.project === remote.project) {
          renderInto('csv:project', { ...row, type: 'remote-project' })
        } else if (row.project === SHARED_PROJECT) {
          renderInto('csv:#shared-links', { ...row, type: 'remote-shared' })
        }
      }
    } catch (err) {
      const message = `Failed to fetch remote CSV: ${(err as Error)?.message ?? String(err)}`
      if (!failSoft) {
        throw err
      }
      diagnostics.push({ level: 'warn', source: 'csv:fetch', message })
    }
  }

  return { context, links, skipped, diagnostics }
}

async function tryGetRepoUrl(cwd: string, logger: EngineLogger): Promise<string | null> {
  try {
    return (await getCurrentRepoUrl(cwd)) ?? null
  } catch (err) {
    logger.warn('repo url lookup failed', err)
    return null
  }
}
