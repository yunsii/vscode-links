import type { JsonObject } from 'type-fest'

/**
 * The complete list of context paths that may appear inside `{{ ... }}`.
 * This is the public contract of the template engine; callers must inject
 * a context whose shape matches these paths (see BuildContextOptions and
 * the template providers in `./providers/`).
 *
 * Adding a variable is a minor schema bump. Removing/renaming is breaking.
 */
export const ALLOWED_TEMPLATE_VARIABLES = [
  'repo.url',
  'git.branch',
  'workspace.fileRelativePath',
  'repoSpecific.github.owner',
  'repoSpecific.github.repo',
  'repoSpecific.cnb.repo',
  'repoSpecific.cnb.groups',
  'repoSpecific.coding.team',
  'repoSpecific.coding.project',
  'repoSpecific.coding.repo',
] as const

export type AllowedTemplateVariable = (typeof ALLOWED_TEMPLATE_VARIABLES)[number]

export type TemplateRenderErrorReason = 'invalid_syntax' | 'unknown_variable' | 'null_value'

export class TemplateRenderError extends Error {
  constructor(
    public readonly reason: TemplateRenderErrorReason,
    public readonly variable: string,
    message: string,
  ) {
    super(message)
    this.name = 'TemplateRenderError'
  }
}

const PLACEHOLDER_RE = /\{\{([^}]*)\}\}/g
const PATH_RE = /^[a-z_][\w-]*(?:\.[a-z_][\w-]*)*$/i

const allowed = new Set<string>(ALLOWED_TEMPLATE_VARIABLES)

/**
 * Substitute every `{{ <path> }}` with the value at `<path>` in `context`.
 *
 * Throws TemplateRenderError on:
 *   - invalid_syntax: the inside is not a dotted path (any operator,
 *     function call, or whitespace inside an identifier qualifies).
 *   - unknown_variable: the path is not in ALLOWED_TEMPLATE_VARIABLES.
 *   - null_value: the path is allowed but resolves to null/undefined
 *     in this particular context (e.g. `workspace.fileRelativePath`
 *     when no editor file is known).
 */
export function renderTemplate(template: string, context: JsonObject): string {
  if (!template || typeof template !== 'string') {
    return template
  }

  return template.replace(PLACEHOLDER_RE, (_match, raw: string) => {
    const path = raw.trim()
    if (!PATH_RE.test(path)) {
      throw new TemplateRenderError(
        'invalid_syntax',
        path,
        `Invalid template syntax: {{${raw}}}. Only dotted paths are supported (e.g. {{repo.url}}); expressions and operators are not.`,
      )
    }
    if (!allowed.has(path)) {
      throw new TemplateRenderError(
        'unknown_variable',
        path,
        `Unknown template variable: {{${path}}}. Supported variables: ${ALLOWED_TEMPLATE_VARIABLES.join(', ')}.`,
      )
    }
    const value = lookup(context, path)
    if (value == null) {
      throw new TemplateRenderError(
        'null_value',
        path,
        `Template variable {{${path}}} resolved to null in this context.`,
      )
    }
    return String(value)
  })
}

function lookup(ctx: JsonObject, path: string): unknown {
  let cursor: unknown = ctx
  for (const key of path.split('.')) {
    if (cursor == null || typeof cursor !== 'object') {
      return undefined
    }
    cursor = (cursor as Record<string, unknown>)[key]
  }
  return cursor
}
