import { describe, expect, it, vi } from 'vitest'

import { resolve } from './resolve'

import type { LinksConfig } from './resolve'

vi.mock('./csv', () => ({
  getLinksResourcesFromRemoteCsv: vi.fn(async (url: string) => {
    if (url === 'mock://fail') {
      throw new Error('mocked network failure')
    }
    return { data: [], errors: [] }
  }),
}))

const isoCwd = '/this/path/should/not/exist/anywhere/12345'

describe('resolve', () => {
  it('returns an empty link list when called outside any repo', async () => {
    const out = await resolve({ cwd: isoCwd })
    expect(out.links).toEqual([])
    expect(out.skipped).toEqual([])
  })

  it('builds a context even when no repo or config is present', async () => {
    const out = await resolve({ cwd: isoCwd })
    expect(out.context).toBeTruthy()
  })

  it('renders a static local link from config.resources', async () => {
    const config: LinksConfig = {
      resources: [{ url: 'https://example.com/wiki', title: 'Team wiki' }],
    }
    const out = await resolve({ cwd: isoCwd, config })
    expect(out.links).toHaveLength(1)
    expect(out.links[0]).toMatchObject({
      type: 'local',
      source: 'settings:links.resources',
      url: 'https://example.com/wiki',
      title: 'Team wiki',
    })
  })

  it('skips a config row whose template uses an unknown variable', async () => {
    const config: LinksConfig = {
      resources: [{ url: 'https://example.com/{{custom.var}}', title: 'Bad' }],
    }
    const out = await resolve({ cwd: isoCwd, config })
    expect(out.links).toEqual([])
    expect(out.skipped).toHaveLength(1)
    expect(out.skipped[0].reason).toBe('unknown_variable')
    expect(out.skipped[0].variable).toBe('custom.var')
  })

  it('skips a config row that resolves to null in this context', async () => {
    const config: LinksConfig = {
      resources: [{
        url: 'https://example.com/blob/{{git.branch}}/{{workspace.fileRelativePath}}',
        title: 'File',
      }],
    }
    const out = await resolve({ cwd: isoCwd, config })
    expect(out.skipped).toHaveLength(1)
    expect(out.skipped[0].reason).toBe('null_value')
  })

  it('does not throw when remoteResources is unset', async () => {
    const out = await resolve({ cwd: isoCwd, config: { remoteResources: null } })
    expect(out.diagnostics).toEqual([])
  })

  it('reports remote CSV failure under diagnostics when failSoft (default)', async () => {
    const out = await resolve({
      cwd: isoCwd,
      config: { remoteResources: { url: 'mock://fail' } },
    })
    expect(out.diagnostics.some((d) => d.source === 'csv:fetch')).toBe(true)
    expect(out.links).toEqual([])
  })

  it('rethrows remote CSV failure when failSoft=false', async () => {
    let thrown: unknown
    try {
      await resolve({
        cwd: isoCwd,
        config: { remoteResources: { url: 'mock://fail' } },
        failSoft: false,
      })
    } catch (err) {
      thrown = err
    }
    expect(thrown).toBeInstanceOf(Error)
  })

  it('emits detected GitHub links when run inside this repo', async () => {
    // The vscode-links repo lives on github.com/yunsii/vscode-links — use it
    // as a built-in fixture so we exercise the detected:github branch.
    const out = await resolve({ cwd: process.cwd() })
    const detected = out.links.filter((l) => l.source === 'detected:github')
    expect(detected.length).toBeGreaterThan(0)
    // "GitHub Repo" row has no template variables so it must always be present.
    expect(detected.some((l) => l.title === 'GitHub Repo')).toBe(true)
  })

  it('skips detected GitHub rows whose template needs editor context', async () => {
    const out = await resolve({ cwd: process.cwd() })
    // "GitHub Repo Current File" template includes
    // {{workspace.fileRelativePath}}, which is null without an editor.
    expect(out.skipped.some((s) => s.raw.title === 'GitHub Repo Current File')).toBe(true)
  })
})
