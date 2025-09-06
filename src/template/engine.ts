import type { JsonObject } from 'type-fest'

import type { BaseLinkResource } from '@/helpers/schemas'
import { logger } from '@/utils'

import { renderTemplate } from './adapter'
import { cnbProvider } from './providers/cnb'
import { codingProvider } from './providers/coding'
import { gitProvider } from './providers/git'
import { githubProvider } from './providers/github'

import type { TemplateContext, TemplateContextFragment, TemplateProvider } from './providers/types'

const providers: TemplateProvider[] = [
  cnbProvider,
  codingProvider,
  gitProvider,
  githubProvider,
]

export function registerProvider(provider: TemplateProvider): void {
  providers.push(provider)
}

export async function buildContext(options: { workspacePath?: string, repoUrl?: string | null }): Promise<TemplateContext> {
  // collect fragments with provider id so we can preserve raw fragments for
  // backward compatibility (attached under `_raw`)
  const fragments: Array<{ id: string, frag: TemplateContextFragment }> = []
  for (const p of providers) {
    const start = Date.now()
    try {
      if (typeof p.match === 'function' && !p.match(options.repoUrl ?? undefined)) {
        logger.info('provider skipped (no match)', p.id)
        continue
      }

      logger.info('provider matched, collecting context', p.id)

      const frag = await p.getContext(options)
      const elapsed = Date.now() - start
      logger.info('provider context collected', p.id, JSON.stringify({ elapsed }))
      fragments.push({ id: p.id, frag })
    } catch (err) {
      // swallow provider errors but continue
      logger.warn('template provider error', p.id, err)
    }
  }

  // merge fragments shallowly - later providers override earlier keys
  const ctx: TemplateContext = {}
  for (const { frag } of fragments) {
    Object.assign(ctx, frag)
  }

  // preserve original provider fragments under a reserved `_raw` key so
  // callers can access provider-specific shapes for backward compatibility.
  const rawMap: Record<string, TemplateContextFragment> = {}
  for (const { id, frag } of fragments) {
    rawMap[id] = frag
  }

  ctx._raw = rawMap

  // Log a compact summary of the built context (top-level keys and _raw provider ids)
  try {
    const topKeys = Object.keys(ctx).filter((k) => k !== '_raw')
    const rawProviders = Object.keys(rawMap)
    logger.info('template context built', JSON.stringify({ topKeys, rawProviders }))
  } catch (err) {
    // non-fatal
  }

  return ctx
}

export function renderResource(resource: BaseLinkResource, context: JsonObject): BaseLinkResource {
  const renderedUrl = renderTemplate(resource.url, context)
  const renderedTitle = renderTemplate(resource.title, context)
  const renderedDescription = resource.description ? renderTemplate(resource.description, context) : undefined

  const out: BaseLinkResource = {
    url: renderedUrl,
    title: renderedTitle,
    description: renderedDescription,
    type: resource.type,
    meta: resource.meta,
  }

  return out
}

export async function renderResources(resources: BaseLinkResource[], options: { workspacePath?: string, repoUrl?: string | null }): Promise<BaseLinkResource[]> {
  const context = await buildContext(options)
  logger.info('builded context', JSON.stringify(context))
  const rendered: BaseLinkResource[] = []
  for (const r of resources) {
    try {
      const before = { url: r.url, title: r.title }
      const out = renderResource(r, context)
      const after = { url: out.url, title: out.title }
      rendered.push(out)
      logger.info('resource rendered', JSON.stringify({ before, after }))
    } catch (err) {
      // on render error, return original resource
      logger.warn('template render error, returning original resource', err)
      rendered.push(r)
    }
  }

  logger.info('renderResources completed', JSON.stringify({ total: resources.length }))
  return rendered
}
