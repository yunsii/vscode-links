<!-- markdownlint-disable heading-start-left no-inline-html first-line-h1 -->

<div align="center">

<img alt="Logo" src="packages/vsix/res/icon.png" width="280">

# VS Code Links

> <p>Pursue better UX for project links — across VS Code, the shell, and any Node app.</p>

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/yuns.links?logo=data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMzAuODY1IDMuNDQ4bC02LjU4My0zLjE2N2MtMC43NjYtMC4zNy0xLjY3Ny0wLjIxNC0yLjI3NiAwLjM4NWwtMTIuNjA5IDExLjUwNS01LjQ5NS00LjE2N2MtMC41MS0wLjM5MS0xLjIyOS0wLjM1OS0xLjcwMyAwLjA3M2wtMS43NiAxLjYwNGMtMC41ODMgMC41MjYtMC41ODMgMS40NDMtMC4wMDUgMS45NjlsNC43NjYgNC4zNDktNC43NjYgNC4zNDljLTAuNTc4IDAuNTI2LTAuNTc4IDEuNDQzIDAuMDA1IDEuOTY5bDEuNzYgMS42MDRjMC40NzkgMC40MzIgMS4xOTMgMC40NjQgMS43MDMgMC4wNzNsNS40OTUtNC4xNzIgMTIuNjE1IDExLjUxYzAuNTk0IDAuNTk5IDEuNTA1IDAuNzU1IDIuMjcxIDAuMzg1bDYuNTg5LTMuMTcyYzAuNjkzLTAuMzMzIDEuMTMtMS4wMzEgMS4xMy0xLjgwMnYtMjEuNDk1YzAtMC43NjYtMC40NDMtMS40NjktMS4xMzUtMS44MDJ6TTI0LjAwNSAyMy4yNjZsLTkuNTczLTcuMjY2IDkuNTczLTcuMjY2eiIvPjwvc3ZnPg==&logoColor=%23000&label=VS%20Code%20Marketplace&labelColor=%23FAFAFA&color=%23212121)](https://marketplace.visualstudio.com/items?itemName=yuns.links)
[![Made with reactive-vscode](https://img.shields.io/badge/made_with-reactive--vscode-212121?style=flat&labelColor=fff&logo=visual-studio-code&logoColor=fff)](https://kermanx.github.io/reactive-vscode/)

[**🐛 Report Bug**](https://github.com/yunsii/vscode-links/issues/new) &nbsp;&nbsp;•&nbsp;&nbsp;
[**✨ Request Feature**](https://github.com/yunsii/vscode-links/issues/new) &nbsp;&nbsp;•&nbsp;&nbsp;
[**🔍 View Source**](https://github.com/yunsii/vscode-links)

</div>

---

## Table of Contents

- [Features](#features)
- [Install](#install)
- [Usage](#usage)
- [Commands](#commands)
- [Configurations](#configurations)
- [Other Consumers](#other-consumers)
  - [CLI (`vscode-links`)](#cli-vscode-links)
  - [Node addon (`@vscode-links/native`)](#node-addon-vscode-linksnative)
- [Architecture](#architecture)
- [Repository Layout](#repository-layout)
- [Roadmap](#roadmap)
- [License](#license)

## Features

- 🚀 **One-click setup** - Add project links directly in VS Code settings
- ⚡ **Instant access** - Open links with just a few keystrokes via Command Palette
- 🔧 **Custom links** - Define your own link resources with custom titles and URLs
- 🔍 **Smart detection** - Auto-discovers links from GitHub, CODING, and CNB repositories
- 🎯 **Dynamic templates** - Use `{{repo.url}}`, `{{git.branch}}` variables for context-aware links ([see all variables](./docs/variables.md))
- 📊 **Tree view** - Browse organized links with search and filtering in sidebar
- 📈 **Status bar** - Quick link count and access right from the status bar
- 👥 **Team sharing** - Share links via remote CSV files for team collaboration
- 🦀 **Native core** - Provider parsing, template rendering, and CSV resolution all run in a Rust core shared with the CLI and the Node addon, so VS Code, your terminal picker, and any Node tool see byte-equal results

## Install

From the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=yuns.links) — search "Links" by `yuns` in the Extensions view, or run:

```sh
code --install-extension yuns.links
```

Offline / air-gapped: grab the per-arch `.vsix` from the [latest GitHub Release](https://github.com/yunsii/vscode-links/releases/latest) and `code --install-extension links-<platform>.vsix`.

## Usage

1. Add your project links to `.vscode/settings.json`:

```jsonc
{
  "links.resources": [
    {
      "url": "https://github.com/yunsii/vscode-links",
      "title": "GitHub Repository"
    }
    // Add more links as needed
  ]
}
```

2. Open the [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) (<kbd>Ctrl+Shift+P</kbd> or <kbd>Cmd+Shift+P</kbd> on **macOS**).

3. Type **Links: Open...** and select it.

4. Choose the link you want to open in your default browser 🎉.

## Commands

<!-- commands -->

| Command             | Title                    |
| ------------------- | ------------------------ |
| `links.openPicker`  | Links: Open Picker       |
| `links.refresh`     | Links: Refresh           |
| `links.enterSearch` | Links: Enter Search Mode |
| `links.exitSearch`  | Links: Exit Search Mode  |
| `links.openUrl`     | Links: Open Link         |
| `links.copyUrl`     | Links: Copy Link URL     |

<!-- commands -->

> **Auto-refresh on branch switch:** when the built-in `vscode.git` extension is enabled (the default), links re-resolve automatically as soon as `HEAD` changes, so `{{git.branch}}` stays in sync. If you've set `"git.enabled": false` or run a distribution without the Git extension, run **Links: Refresh** manually after switching branches.

## Configurations

<!-- configs -->

| Key                     | Description                                                                                         | Type        | Default                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| `links.resources`       | Local resources to open                                                                             | `array`     | ``                                                                                             |
| `links.remoteResources` | Remote resources to open: set to an object with `url` and `project`. Leave unset (null) to disable. | `undefined` | ``                                                                                             |
| `links.customIcons`     | Custom icons for different link types                                                               | `object`    | `{ "local": "folder", "detected": "eye", "remote-project": "repo", "remote-shared": "share" }` |

<!-- configs -->

### Remote Resources Example

To use remote CSV resources, add this to your `.vscode/settings.json`:

```jsonc
{
  "links.remoteResources": {
    "url": "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlzHErycXFRcNf2u9kB3SndusKyGaAEmoh2gueEKEtkTaibfMKKgOonlJhgBArqKrKJJlXthTo7LFN/pub?gid=0&single=true&output=csv",
    "project": "my-project"
  }
}
```

The CSV file should have columns: `project` (required), `url` (required), `title` (required), `description` (optional).

**How it works:**

- Links with `project` matching your configured project name appear as **project-specific links**
- Links with `project: "#shared-links"` appear as **shared team links**
- Other links are filtered out automatically

## Other Consumers

The same link resolution logic ships in two more shapes besides the VS Code extension. All three read the same `.vscode/settings.json`, run the same provider matchers, and render the same template variables — there is one source of truth (the Rust `crates/core`), so what you configure for VS Code automatically works in your terminal and any Node script.

### CLI (`vscode-links`)

A standalone binary for shell pipelines, terminal pickers (e.g. wezterm / tmux popups), and CI scripts. No Node, no npm, no extension required.

**Install** (Linux / macOS / WSL):

```sh
curl -fsSL https://github.com/yunsii/vscode-links/releases/latest/download/install.sh | sh
```

The script picks the right pre-built binary for your host (`linux-x64-gnu`, `linux-arm64-gnu`, `darwin-x64`, `darwin-arm64`, `win32-x64-msvc`), verifies its SHA256, and installs it to `$XDG_BIN_HOME` / `~/.local/bin` / `/usr/local/bin`. Override with `INSTALL_PREFIX=/path sh`.

**Usage**:

```sh
# Resolve all links for the current workspace, default JSON output
vscode-links resolve --cwd "$(pwd)"

# NDJSON for streaming consumers (one record per line, tagged by kind)
vscode-links resolve --cwd "$(pwd)" --format ndjson

# TSV for shell pipelines: type<TAB>source<TAB>url<TAB>title
vscode-links resolve --cwd "$(pwd)" --format tsv

# Inject editor context (e.g. when called from a terminal-side picker)
vscode-links resolve --cwd "$(pwd)" \
  --editor-context '{"fileRelativePath":"src/main.rs"}'
```

Exit codes: `0` ok, `2` usage, `3` config, `4` runtime. See `vscode-links --help`.

### Node addon (`@vscode-links/native`)

A drop-in Node module backed by the same Rust core via N-API. For Node tools that want the resolved link list in-process, without spawning a subprocess.

```sh
npm i @vscode-links/native
```

```ts
import { resolve } from '@vscode-links/native'

const result = resolve({
  cwd: process.cwd(),
  editorContext: { fileRelativePath: 'src/index.ts' },
})

for (const link of result.links) {
  console.log(link.source, link.url)
}
```

The published package uses `optionalDependencies` to install only the `.node` for your host architecture (the same per-arch model as `esbuild`, `swc`, etc.).

## Architecture

```
                            crates/core (Rust)
                            ── single source of truth ──
                              providers · template
                              csv · context · resolve
                                       │
                ┌──────────────────────┼──────────────────────┐
                │                      │                      │
        crates/cli              crates/napi              packages/vsix
        ──────────              ──────────              ──────────
        clap-based bin          N-API binding           bundles its own
                                                        .node next to
                                                        dist/index.js
              │                      │                      │
              ▼                      ▼                      ▼
        vscode-links            @vscode-links            5 per-arch
        binary                  /native                  .vsix files
              │                      │                      │
              ▼                      ▼                      ▼
        shell users /          Node tools              VS Code users
        wezterm pickers        (in-process)            (marketplace)
```

The strict-whitelist template engine accepts only the documented variables (`{{repo.url}}`, `{{git.branch}}`, `{{workspace.fileRelativePath}}`, `{{repoSpecific.<provider>.<...>}}`); any other expression throws a typed error so the contract is identical across the three runtimes.

## Repository Layout

```
crates/                       Rust workspace
├── core                      providers, template, csv, git, resolve
├── cli                       vscode-links binary (clap)
└── napi                      N-API cdylib

packages/                     pnpm workspace
├── vsix                      VS Code extension (this is what you install
│                             from the marketplace)
└── native                    @vscode-links/native — Node façade for the
                              .node addon, with per-arch optional deps

tools/
└── cli-installer             install.sh template, rendered per release

.github/workflows/
├── ci.yml                    lint, typecheck, JS tests
├── rust.yml                  cargo test/fmt/clippy + 5-target build matrix
├── release.yml               v*           tag → 5 per-arch VSIX → marketplace
├── native-release.yml        native-v*    tag → 5 per-arch npm packages
└── cli-release.yml           cli-v*       tag → 5 GH Releases archives + install.sh
```

## Roadmap

- Localization support for multiple languages
- Editor-context aware variants (selection ranges, permalinks)
- Optional daemon mode for sub-millisecond CLI calls

## License

[MIT](./LICENSE) License © 2025 [Yuns](https://github.com/yunsii)
