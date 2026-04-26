import { describe, expect, it } from 'vitest'

import { ALLOWED_TEMPLATE_VARIABLES, renderTemplate, TemplateRenderError } from './adapter'

const fullCtx = {
  repo: { url: 'https://github.com/owner/repo.git' },
  git: { branch: 'feat-x' },
  workspace: { fileRelativePath: 'src/x.ts' },
  repoSpecific: {
    github: { owner: 'owner', repo: 'repo' },
    cnb: { repo: 'repo', groups: 'g/sg' },
    coding: { team: 'team', project: 'project', repo: 'repo' },
  },
}

describe('renderTemplate', () => {
  it('returns the input unchanged when there are no placeholders', () => {
    expect(renderTemplate('plain text', {})).toBe('plain text')
  })

  it('returns the input unchanged when input is empty', () => {
    expect(renderTemplate('', { x: '1' })).toBe('')
  })

  it('substitutes a single allowed variable', () => {
    expect(renderTemplate('{{repo.url}}', fullCtx)).toBe('https://github.com/owner/repo.git')
  })

  it('substitutes multiple allowed variables in one template', () => {
    const tpl = '{{repo.url}}/blob/{{git.branch}}/{{workspace.fileRelativePath}}'
    expect(renderTemplate(tpl, fullCtx)).toBe('https://github.com/owner/repo.git/blob/feat-x/src/x.ts')
  })

  it('tolerates whitespace inside the braces', () => {
    expect(renderTemplate('{{  git.branch  }}', fullCtx)).toBe('feat-x')
  })

  it('renders every documented variable from a complete context', () => {
    for (const v of ALLOWED_TEMPLATE_VARIABLES) {
      const out = renderTemplate(`x:{{${v}}}:y`, fullCtx)
      expect(out.startsWith('x:')).toBe(true)
      expect(out.endsWith(':y')).toBe(true)
      expect(out).not.toContain('{{')
    }
  })

  it('throws unknown_variable for an undocumented path', () => {
    let err: TemplateRenderError | undefined
    try {
      renderTemplate('{{custom.var}}', fullCtx)
    } catch (e) {
      err = e as TemplateRenderError
    }
    expect(err).toBeInstanceOf(TemplateRenderError)
    expect(err?.reason).toBe('unknown_variable')
    expect(err?.variable).toBe('custom.var')
  })

  it('throws invalid_syntax for an expression', () => {
    let err: TemplateRenderError | undefined
    try {
      renderTemplate(`{{repo.url || 'fallback'}}`, fullCtx)
    } catch (e) {
      err = e as TemplateRenderError
    }
    expect(err).toBeInstanceOf(TemplateRenderError)
    expect(err?.reason).toBe('invalid_syntax')
  })

  it('throws invalid_syntax for a function call', () => {
    let err: TemplateRenderError | undefined
    try {
      renderTemplate('{{encodeURIComponent(repo.url)}}', fullCtx)
    } catch (e) {
      err = e as TemplateRenderError
    }
    expect(err).toBeInstanceOf(TemplateRenderError)
    expect(err?.reason).toBe('invalid_syntax')
  })

  it('throws invalid_syntax for empty braces', () => {
    let err: TemplateRenderError | undefined
    try {
      renderTemplate('{{}}', fullCtx)
    } catch (e) {
      err = e as TemplateRenderError
    }
    expect(err).toBeInstanceOf(TemplateRenderError)
    expect(err?.reason).toBe('invalid_syntax')
  })

  it('throws null_value when an allowed variable is null in this context', () => {
    let err: TemplateRenderError | undefined
    try {
      renderTemplate('{{workspace.fileRelativePath}}', {
        ...fullCtx,
        workspace: { fileRelativePath: null },
      })
    } catch (e) {
      err = e as TemplateRenderError
    }
    expect(err).toBeInstanceOf(TemplateRenderError)
    expect(err?.reason).toBe('null_value')
    expect(err?.variable).toBe('workspace.fileRelativePath')
  })

  it('throws null_value when the parent path is missing from context', () => {
    let err: TemplateRenderError | undefined
    try {
      renderTemplate('{{repoSpecific.github.owner}}', { repo: { url: 'x' } })
    } catch (e) {
      err = e as TemplateRenderError
    }
    expect(err).toBeInstanceOf(TemplateRenderError)
    expect(err?.reason).toBe('null_value')
  })
})
