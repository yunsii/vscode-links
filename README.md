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
- [Roadmap](#roadmap)
- [License](#license)

## Features

- Initialize and manage project-related links directly from VS Code.
- Quick access to project links via the Command Palette.
- Supports custom link resources.

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

## Roadmap

- [ ] Support auto-parsing of git repository web links
  - [ ] GitHub
  - [x] CODING
- [ ] Localization support for multiple languages
- [ ] Improve links management UI

## License

[MIT](./LICENSE) License © 2024 [Yuns](https://github.com/yunsii)
