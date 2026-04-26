// Library entry: programmatic API for non-shell consumers (a Node tool
// that wants the same behavior as the bin without spawning it).

export { format } from './format'
export type { OutputFormat } from './format'
export { run } from './run'
export type { CliExitCode, RunOptions, RunResult } from './run'
export { findWorkspaceSettings, loadLinksConfigFromCwd, loadLinksConfigFromFile } from './settings'
