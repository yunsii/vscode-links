// Pure orchestration: argv → core.resolve() → formatted string.
// Both `cli.ts` (process entry) and the test suite call `run()`.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { resolve as resolveLinks } from '@vscode-links/core'

import { format } from './format'
import { loadLinksConfigFromCwd, loadLinksConfigFromFile } from './settings'

import type { OutputFormat } from './format'

export type CliExitCode = 0 | 2 | 3 | 4

export interface RunOptions {
  argv: string[]
  cwd: string
}

export interface RunResult {
  exitCode: CliExitCode
  stdout: string
  stderr: string
}

interface ResolveCmdOptions {
  cwd: string
  configPath: string | null
  format: OutputFormat
  editorContext: { fileRelativePath?: string | null } | null
}

const HELP = `
  vscode-links - resolve project links from a workspace

  USAGE:
    vscode-links resolve --cwd <path> [options]

  RESOLVE OPTIONS:
    --cwd <path>            workspace / pane cwd (required)
    --config <path>         override .vscode/settings.json location
    --editor-context <s>    JSON object or @file with { "fileRelativePath": "..." }
    --format <f>            json (default) | ndjson | tsv

  GLOBAL OPTIONS:
    -h, --help              show this help
        --version           print version

  EXIT CODES:
    0  success
    2  usage error (bad argv)
    3  configuration error (invalid JSONC, missing required arg, ...)
    4  runtime error (filesystem, network, git, ...)
`

export async function run(opts: RunOptions): Promise<RunResult> {
  const { argv } = opts

  if (argv.length === 0 || argv.includes('-h') || argv.includes('--help')) {
    return ok(HELP)
  }
  if (argv.includes('--version')) {
    return ok(`${getVersion()}\n`)
  }

  const [subcommand, ...rest] = argv
  switch (subcommand) {
    case 'resolve':
      return runResolve(rest)
    default:
      return usage(`unknown subcommand: ${subcommand}`)
  }
}

async function runResolve(args: string[]): Promise<RunResult> {
  let parsed: ResolveCmdOptions
  try {
    parsed = parseResolveArgs(args)
  } catch (err) {
    return usage((err as Error).message)
  }

  let config
  try {
    config = parsed.configPath
      ? await loadLinksConfigFromFile(parsed.configPath)
      : await loadLinksConfigFromCwd(parsed.cwd)
  } catch (err) {
    return error(3, `failed to load settings: ${(err as Error).message}`)
  }

  let result
  try {
    result = await resolveLinks({
      cwd: parsed.cwd,
      config,
      editorContext: parsed.editorContext ?? undefined,
      failSoft: true,
    })
  } catch (err) {
    return error(4, `resolve failed: ${(err as Error).message}`)
  }

  return ok(format(result, parsed.format))
}

function parseResolveArgs(args: string[]): ResolveCmdOptions {
  let cwd: string | null = null
  let configPath: string | null = null
  let fmt: OutputFormat = 'json'
  let editorContext: { fileRelativePath?: string | null } | null = null

  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    switch (a) {
      case '--cwd':
        cwd = expectValue(args, ++i, '--cwd')
        break
      case '--config':
        configPath = expectValue(args, ++i, '--config')
        break
      case '--format': {
        const v = expectValue(args, ++i, '--format')
        if (v !== 'json' && v !== 'ndjson' && v !== 'tsv') {
          throw new Error(`--format must be one of json|ndjson|tsv, got ${v}`)
        }
        fmt = v
        break
      }
      case '--editor-context': {
        const v = expectValue(args, ++i, '--editor-context')
        editorContext = parseEditorContext(v)
        break
      }
      default:
        throw new Error(`unknown option: ${a}`)
    }
  }

  if (!cwd) {
    throw new Error('--cwd is required')
  }
  return { cwd, configPath, format: fmt, editorContext }
}

function expectValue(args: string[], index: number, flag: string): string {
  const v = args[index]
  if (v == null || v.startsWith('--')) {
    throw new Error(`${flag} requires a value`)
  }
  return v
}

function parseEditorContext(value: string): { fileRelativePath?: string | null } {
  let raw: string
  if (value.startsWith('@')) {
    try {
      raw = readFileSync(value.slice(1), 'utf8')
    } catch (err) {
      throw new Error(`failed to read --editor-context file: ${(err as Error).message}`)
    }
  } else {
    raw = value
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    throw new Error(`--editor-context is not valid JSON: ${(err as Error).message}`)
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('--editor-context must be a JSON object')
  }
  return parsed as { fileRelativePath?: string | null }
}

function ok(stdout: string): RunResult {
  return { exitCode: 0, stdout, stderr: '' }
}

function usage(message: string): RunResult {
  return { exitCode: 2, stdout: '', stderr: `error: ${message}\n\n${HELP}` }
}

function error(code: 3 | 4, message: string): RunResult {
  return { exitCode: code, stdout: '', stderr: `error: ${message}\n` }
}

let cachedVersion: string | null = null
function getVersion(): string {
  if (cachedVersion) {
    return cachedVersion
  }
  try {
    const url = new URL('../package.json', import.meta.url)
    const json = readFileSync(fileURLToPath(url), 'utf8')
    const pkg = JSON.parse(json) as { version?: string }
    cachedVersion = pkg.version ?? '0.0.0'
  } catch {
    cachedVersion = '0.0.0'
  }
  return cachedVersion
}
