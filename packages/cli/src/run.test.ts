import { promises as fs } from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import process from 'node:process'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { run } from './run'

const isolatedCwd = path.join(os.tmpdir(), `vscl-cli-${process.pid}-${Date.now()}`)

beforeAll(async () => {
  await fs.mkdir(isolatedCwd, { recursive: true })
})

afterAll(async () => {
  await fs.rm(isolatedCwd, { recursive: true, force: true })
})

describe('cli', () => {
  it('prints help when called with no args', async () => {
    const r = await run({ argv: [], cwd: isolatedCwd })
    expect(r.exitCode).toBe(0)
    expect(r.stdout).toMatch(/USAGE:/)
  })

  it('prints help with --help', async () => {
    const r = await run({ argv: ['--help'], cwd: isolatedCwd })
    expect(r.exitCode).toBe(0)
    expect(r.stdout).toMatch(/USAGE:/)
  })

  it('rejects unknown subcommand with usage error', async () => {
    const r = await run({ argv: ['foo'], cwd: isolatedCwd })
    expect(r.exitCode).toBe(2)
    expect(r.stderr).toMatch(/unknown subcommand/)
  })

  it('rejects resolve without --cwd', async () => {
    const r = await run({ argv: ['resolve'], cwd: isolatedCwd })
    expect(r.exitCode).toBe(2)
    expect(r.stderr).toMatch(/--cwd is required/)
  })

  it('rejects an unknown --format value', async () => {
    const r = await run({ argv: ['resolve', '--cwd', isolatedCwd, '--format', 'xml'], cwd: isolatedCwd })
    expect(r.exitCode).toBe(2)
    expect(r.stderr).toMatch(/--format must be one of/)
  })

  it('emits json by default for an empty workspace', async () => {
    const r = await run({ argv: ['resolve', '--cwd', isolatedCwd], cwd: isolatedCwd })
    expect(r.exitCode).toBe(0)
    const parsed = JSON.parse(r.stdout)
    expect(parsed).toHaveProperty('context')
    expect(parsed).toHaveProperty('links')
    expect(Array.isArray(parsed.links)).toBe(true)
    expect(parsed.links).toHaveLength(0)
  })

  it('emits ndjson with one line per record', async () => {
    const r = await run({ argv: ['resolve', '--cwd', isolatedCwd, '--format', 'ndjson'], cwd: isolatedCwd })
    expect(r.exitCode).toBe(0)
    const lines = r.stdout.trim().split('\n').filter(Boolean)
    expect(lines.length).toBeGreaterThan(0)
    const first = JSON.parse(lines[0])
    expect(first).toHaveProperty('kind', 'context')
  })

  it('emits empty tsv when there are no links', async () => {
    const r = await run({ argv: ['resolve', '--cwd', isolatedCwd, '--format', 'tsv'], cwd: isolatedCwd })
    expect(r.exitCode).toBe(0)
    expect(r.stdout).toBe('')
  })

  it('reads a workspace .vscode/settings.json and renders local links as tsv', async () => {
    const ws = path.join(os.tmpdir(), `vscl-cli-ws-${process.pid}-${Date.now()}`)
    await fs.mkdir(path.join(ws, '.vscode'), { recursive: true })
    await fs.writeFile(
      path.join(ws, '.vscode', 'settings.json'),
      `
        {
                // VSCode-style JSONC with comments + trailing comma
                "links.resources": [
                  { "url": "https://example.com/wiki", "title": "Team wiki", },
                ],
              }
      `,
    )
    try {
      const r = await run({ argv: ['resolve', '--cwd', ws, '--format', 'tsv'], cwd: ws })
      expect(r.exitCode).toBe(0)
      const rows = r.stdout.trim().split('\n')
      expect(rows).toHaveLength(1)
      const [type, source, url, title] = rows[0].split('\t')
      expect(type).toBe('local')
      expect(source).toBe('settings:links.resources')
      expect(url).toBe('https://example.com/wiki')
      expect(title).toBe('Team wiki')
    } finally {
      await fs.rm(ws, { recursive: true, force: true })
    }
  })

  it('returns exit code 3 on invalid settings.json', async () => {
    const ws = path.join(os.tmpdir(), `vscl-cli-bad-${process.pid}-${Date.now()}`)
    await fs.mkdir(path.join(ws, '.vscode'), { recursive: true })
    await fs.writeFile(path.join(ws, '.vscode', 'settings.json'), '{ this is not json')
    try {
      const r = await run({ argv: ['resolve', '--cwd', ws], cwd: ws })
      expect(r.exitCode).toBe(3)
      expect(r.stderr).toMatch(/failed to load settings/)
    } finally {
      await fs.rm(ws, { recursive: true, force: true })
    }
  })

  it('accepts --editor-context as a JSON object', async () => {
    const r = await run({
      argv: [
        'resolve',
        '--cwd',
        isolatedCwd,
        '--editor-context',
        '{"fileRelativePath":"src/x.ts"}',
      ],
      cwd: isolatedCwd,
    })
    expect(r.exitCode).toBe(0)
    const parsed = JSON.parse(r.stdout)
    expect(parsed.context.workspace.fileRelativePath).toBe('src/x.ts')
  })

  it('rejects malformed --editor-context', async () => {
    const r = await run({
      argv: ['resolve', '--cwd', isolatedCwd, '--editor-context', 'not-json'],
      cwd: isolatedCwd,
    })
    expect(r.exitCode).toBe(2)
    expect(r.stderr).toMatch(/--editor-context is not valid JSON/)
  })
})
