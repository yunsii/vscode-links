<!-- markdownlint-disable heading-start-left no-inline-html first-line-h1 -->

<div align="center">

<img alt="Logo" src="packages/vsix/res/icon.png" width="280">

# VS Code Links

> <p>追求项目链接的更好用户体验 — 在 VS Code、终端、和任何 Node 应用中。</p>

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
- [其它消费方](#其它消费方)
  - [命令行 (`vscode-links`)](#命令行-vscode-links)
  - [Node 原生扩展 (`@vscode-links/native`)](#node-原生扩展-vscode-linksnative)
- [架构](#架构)
- [仓库结构](#仓库结构)
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
- 🦀 **原生内核** - provider 解析、模板渲染、CSV 拉取统一在 Rust core 实现，VS Code 扩展、命令行、Node 模块共用同一份逻辑，行为字节级一致

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

## 其它消费方

同一套链接解析逻辑除了 VS Code 扩展之外，还有两种形态。三者都读同一份 `.vscode/settings.json`、走同一组 provider 匹配、用同一套模板变量 — 真理源只有一个（Rust 的 `crates/core`），所以你为 VS Code 配的东西在终端和 Node 脚本里同样生效。

### 命令行 (`vscode-links`)

为 shell 管线、终端 picker（如 wezterm / tmux popup）、CI 脚本准备的独立二进制。不依赖 Node、不依赖 npm、不需要装扩展。

**安装**（Linux / macOS / WSL）：

```sh
curl -fsSL https://github.com/yunsii/vscode-links/releases/latest/download/install.sh | sh
```

脚本会按你的主机自动选 `linux-x64-gnu` / `linux-arm64-gnu` / `darwin-x64` / `darwin-arm64` / `win32-x64-msvc` 中的对应预编译二进制，校验 SHA256，安装到 `$XDG_BIN_HOME` / `~/.local/bin` / `/usr/local/bin`。可用 `INSTALL_PREFIX=/path sh` 覆盖。

**使用**：

```sh
# 解析当前 workspace 全部链接，默认 JSON 输出
vscode-links resolve --cwd "$(pwd)"

# NDJSON：每行一个 record，按 kind 标签分类，适合流式消费
vscode-links resolve --cwd "$(pwd)" --format ndjson

# TSV：type<TAB>source<TAB>url<TAB>title，shell 管线友好
vscode-links resolve --cwd "$(pwd)" --format tsv

# 注入 editor context（终端 picker 调用时常用）
vscode-links resolve --cwd "$(pwd)" \
  --editor-context '{"fileRelativePath":"src/main.rs"}'
```

退出码：`0` 成功 / `2` 用法错 / `3` 配置错 / `4` 运行时错。详见 `vscode-links --help`。

### Node 原生扩展 (`@vscode-links/native`)

通过 N-API 绑定到同一 Rust core 的 Node 模块。给希望进程内消费链接列表、不想 spawn 子进程的 Node 工具用。

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

发布的 npm 包用 `optionalDependencies` 只装匹配你主机架构的 `.node`（与 `esbuild`、`swc` 等同款 per-arch 模型）。

## 架构

```
                            crates/core (Rust)
                            ── 真理源 ──
                              providers · template
                              csv · context · resolve
                                       │
                ┌──────────────────────┼──────────────────────┐
                │                      │                      │
        crates/cli              crates/napi              packages/vsix
        ──────────              ──────────              ──────────
        clap-based bin          N-API 绑定              自带 .node 与
                                                        dist/index.js
                                                        同目录
              │                      │                      │
              ▼                      ▼                      ▼
        vscode-links            @vscode-links            5 个 per-arch
        二进制                  /native                  .vsix 文件
              │                      │                      │
              ▼                      ▼                      ▼
        shell 用户 /            Node 工具              VS Code 用户
        wezterm picker          （进程内调用）         （marketplace +
                                                       open-vsx）
```

严格白名单模板引擎只接受文档列出的变量（`{{repo.url}}`、`{{git.branch}}`、`{{workspace.fileRelativePath}}`、`{{repoSpecific.<provider>.<...>}}`）；任何其他表达式都会抛出带类型的错误，确保契约在三个运行时下完全一致。

## 仓库结构

```
crates/                       Rust workspace
├── core                      providers · template · csv · git · resolve
├── cli                       vscode-links 二进制（基于 clap）
└── napi                      N-API cdylib

packages/                     pnpm workspace
├── vsix                      VS Code 扩展（marketplace 上装的就是它）
└── native                    @vscode-links/native — .node addon 的
                              Node 包装，用 per-arch optional deps

tools/
└── cli-installer             install.sh 模板，每次 release 时渲染

.github/workflows/
├── ci.yml                    lint、typecheck、JS 测试
├── rust.yml                  cargo test/fmt/clippy + 5-target 构建矩阵
├── release.yml               v*           tag → 5 per-arch VSIX → marketplace
├── native-release.yml        native-v*    tag → 5 per-arch npm 包
└── cli-release.yml           cli-v*       tag → 5 GH Releases 归档 + install.sh
```

## 路线图

- [ ] 支持多语言本地化
- [ ] 编辑器上下文感知变体（选区、permalink）
- [ ] 可选的常驻进程模式，把命令行调用降到亚毫秒级

## 许可证

[MIT](./LICENSE) License © 2025 [Yuns](https://github.com/yunsii)
