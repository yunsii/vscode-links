<!-- markdownlint-disable heading-start-left no-inline-html first-line-h1 -->

<div align="center">

<img alt="Logo" src="res/icon.png" width="280">

# VS Code Links

> <p>Pursue better UX for project links</p>

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/yuns.links?logo=data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMzAuODY1IDMuNDQ4bC02LjU4My0zLjE2N2MtMC43NjYtMC4zNy0xLjY3Ny0wLjIxNC0yLjI3NiAwLjM4NWwtMTIuNjA5IDExLjUwNS01LjQ5NS00LjE2N2MtMC41MS0wLjM5MS0xLjIyOS0wLjM1OS0xLjcwMyAwLjA3M2wtMS43NiAxLjYwNGMtMC41ODMgMC41MjYtMC41ODMgMS40NDMtMC4wMDUgMS45NjlsNC43NjYgNC4zNDktNC43NjYgNC4zNDljLTAuNTc4IDAuNTI2LTAuNTc4IDEuNDQzIDAuMDA1IDEuOTY5bDEuNzYgMS42MDRjMC40NzkgMC40MzIgMS4xOTMgMC40NjQgMS43MDMgMC4wNzNsNS40OTUtNC4xNzIgMTIuNjE1IDExLjUxYzAuNTk0IDAuNTk5IDEuNTA1IDAuNzU1IDIuMjcxIDAuMzg1bDYuNTg5LTMuMTcyYzAuNjkzLTAuMzMzIDEuMTMtMS4wMzEgMS4xMy0xLjgwMnYtMjEuNDk1YzAtMC43NjYtMC40NDMtMS40NjktMS4xMzUtMS44MDJ6TTI0LjAwNSAyMy4yNjZsLTkuNTczLTcuMjY2IDkuNTczLTcuMjY2eiIvPjwvc3ZnPg==&logoColor=%23000&label=VS%20Code%20Marketplace&labelColor=%23FAFAFA&color=%23212121)](https://marketplace.visualstudio.com/items?itemName=yuns.links)
[![Made with reactive-vscode](https://img.shields.io/badge/made_with-reactive--vscode-212121?style=flat&labelColor=fff&logo=visual-studio-code&logoColor=fff)](https://kermanx.github.io/reactive-vscode/)

[**🐛 Report Bug**](https://github.com/yunsii/vscode-links/issues/new) &nbsp;&nbsp;•&nbsp;&nbsp;
[**✨ Request Feature**](https://github.com/yunsii/vscode-links/issues/new) &nbsp;&nbsp;•&nbsp;&nbsp;
[**🔍 View Source**](https://github.com/yunsii/vscode-links)

</div>

---

## Table of Contents

- [Features](#features)
- [Usage](#usage)
- [Commands](#commands)
- [Configurations](#configurations)
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

## Roadmap

- Localization support for multiple languages

## License

[MIT](./LICENSE) License © 2025 [Yuns](https://github.com/yunsii)
