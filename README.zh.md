<!-- markdownlint-disable heading-start-left no-inline-html first-line-h1 -->

<div align="center">

<img alt="Logo" src="packages/vsix/res/icon.png" width="280">

# VS Code Links

> <p>追求项目链接的更好用户体验</p>

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/yuns.links?logo=data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMzAuODY1IDMuNDQ4bC02LjU4My0zLjE2N2MtMC43NjYtMC4zNy0xLjY3Ny0wLjIxNC0yLjI3NiAwLjM4NWwtMTIuNjA5IDExLjUwNS01LjQ5NS00LjE2N2MtMC41MS0wLjM5MS0xLjIyOS0wLjM1OS0xLjcwMyAwLjA3M2wtMS43NiAxLjYwNGMtMC41ODMgMC41MjYtMC41ODMgMS40NDMtMC4wMDUgMS45NjlsNC43NjYgNC4zNDktNC43NjYgNC4zNDljLTAuNTc4IDAuNTI2LTAuNTc4IDEuNDQzIDAuMDA1IDEuOTY5bDEuNzYgMS42MDRjMC40NzkgMC40MzIgMS4xOTMgMC40NjQgMS43MDMgMC4wNzNsNS40OTUtNC4xNzIgMTIuNjE1IDExLjUxYzAuNTk0IDAuNTk5IDEuNTA1IDAuNzU1IDIuMjcxIDAuMzg1bDYuNTg5LTMuMTcyYzAuNjkzLTAuMzMzIDEuMTMtMS4wMzEgMS4xMy0xLjgwMnYtMjEuNDk1YzAtMC43NjYtMC40NDMtMS40NjktMS4xMzUtMS44MDJ6TTI0LjAwNSAyMy4yNjZsLTkuNTczLTcuMjY2IDkuNTczLTcuMjY2eiIvPjwvc3ZnPg==&logoColor=%23000&label=VS%20Code%20Marketplace&labelColor=%23FAFAFA&color=%23212121)](https://marketplace.visualstudio.com/items?itemName=yuns.links)
[![Made with reactive-vscode](https://img.shields.io/badge/made_with-reactive--vscode-212121?style=flat&labelColor=fff&logo=visual-studio-code&logoColor=fff)](https://kermanx.github.io/reactive-vscode/)

[**🐛 报告 Bug**](https://github.com/yunsii/vscode-links/issues/new) &nbsp;&nbsp;•&nbsp;&nbsp;
[**✨ 请求特性**](https://github.com/yunsii/vscode-links/issues/new) &nbsp;&nbsp;•&nbsp;&nbsp;
[**🔍 查看源码**](https://github.com/yunsii/vscode-links)

</div>

---

## 目录

- [功能](#功能)
- [使用](#使用)
- [命令](#命令)
- [配置](#配置)
- [路线图](#路线图)
- [许可证](#许可证)

## 功能

- 🚀 **一键设置** - 直接在 VS Code 设置中添加项目链接
- ⚡ **即时访问** - 通过命令面板快速打开链接
- 🔧 **自定义链接** - 定义自己的链接资源和标题
- 🔍 **智能检测** - 自动发现 GitHub、CODING 和 CNB 仓库的链接
- 🎯 **动态模板** - 使用 `{{repo.url}}`、`{{git.branch}}` 等变量创建上下文感知链接（[查看所有变量](./docs/variables.zh.md)）
- 📊 **树形视图** - 在侧边栏中浏览组织良好的链接，支持搜索和过滤
- 📈 **状态栏** - 在状态栏中显示链接数量和快速访问
- 👥 **团队共享** - 通过远程 CSV 文件共享链接，支持团队协作

## 使用

1. 将你的项目链接添加到 `.vscode/settings.json`：

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

2. 打开 [命令面板](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette)（<kbd>Ctrl+Shift+P</kbd> 或 macOS 上的 <kbd>Cmd+Shift+P</kbd>）。

3. 输入 **Links: Open...** 并选择它。

4. 从列表中选择一个链接，链接将在默认浏览器中打开 🎉。

## 命令

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

## 配置

<!-- configs -->

| 键                      | 描述                                                                              | 类型            | 默认                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| `links.resources`       | 要打开的本地资源列表                                                              | `array`         | ``                                                                                             |
| `links.remoteResources` | 远程资源配置（对象，包含 `url` 与 `project`）。不设置或为 `null` 则禁用远程资源。 | `object / null` | ``                                                                                             |
| `links.customIcons`     | 不同链接类型的自定义图标                                                          | `object`        | `{ "local": "folder", "detected": "eye", "remote-project": "repo", "remote-shared": "share" }` |

<!-- configs -->

### 远程资源示例

要在 `.vscode/settings.json` 中使用远程 CSV 资源，请添加以下配置：

```jsonc
{
  "links.remoteResources": {
    "url": "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlzHErycXFRcNf2u9kB3SndusKyGaAEmoh2gueEKEtkTaibfMKKgOonlJhgBArqKrKJJlXthTo7LFN/pub?gid=0&single=true&output=csv",
    "project": "my-project"
  }
}
```

CSV 文件应包含以下列：`project`（必填）、`url`（必填）、`title`（必填）、`description`（可选）。

**工作原理：**

- `project` 字段与配置的项目名匹配的链接显示为**项目专用链接**
- `project` 字段为 `"#shared-links"` 的链接显示为**共享团队链接**
- 其他链接会被自动过滤掉

## 路线图

- [ ] 支持多语言本地化

## 许可证

[MIT](./LICENSE) License © 2025 [Yuns](https://github.com/yunsii)
