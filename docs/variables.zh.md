# 模板变量说明（中文）

本文档列出内置 provider 注入到模板上下文中的变量。你可以在模板中直接使用这些变量，例如 `{{repo.url}}`、`{{repoSpecific.github.owner}}`。

保留的行为

- 所有 provider 的原始 fragment 会被保存在特殊键 `_raw` 下，子键为 provider 的 `id`。例如 `_raw.cnb`、`_raw.github` 包含对应 provider 返回的原始对象。

内置 provider 列表

1. git

- `repo.url` — 当前工作区检测到的仓库远程 URL。
- `git.branch` — 当前分支名。
- `workspace.fileRelativePath` — 当前文件相对于工作区根的路径。

示例：

- `{{repo.url}}` → `https://github.com/owner/repo.git`
- `{{git.branch}}` → `main`
- `{{workspace.fileRelativePath}}` → `src/commands/open/cnb/index.ts`

2. cnb

注入位置为 `repoSpecific.cnb`：

- `repoSpecific.cnb.repo` — 从 CNB 仓库 URL 解析出的仓库名。
- `repoSpecific.cnb.groups` — 用 `/` 连接的分组字符串，例如 `group/subgroup`。

原始片段：`_raw.cnb` 包含 provider 返回的原始对象。

3. github

注入位置为 `repoSpecific.github`：

- `repoSpecific.github.owner` — 仓库拥有者（用户或组织）。
- `repoSpecific.github.repo` — 仓库名。

原始片段：`_raw.github` 包含 provider 返回的原始对象。

4. coding

注入位置为 `repoSpecific.coding`：

- `repoSpecific.coding.team` — Coding 团队名。
- `repoSpecific.coding.project` — Coding 项目名。
- `repoSpecific.coding.repo` — Coding 仓库名。

原始片段：`_raw.coding` 包含 provider 返回的原始对象。

使用要点

- 引擎对 provider 片段进行浅合并（shallow merge）；后注册的 provider 会覆盖先前 provider 的同名顶级键。
- 若需要访问 provider 返回的原始结构，可使用 `_raw.{providerId}`。
- 如果没有 provider 匹配 `repoUrl` 或 provider 抛出异常，引擎会记录警告并继续，相关字段在上下文中将缺失。

git 变更时的自动刷新

- VS Code 扩展启动时会对每个工作区文件夹执行 `git rev-parse --absolute-git-dir` 解析出真实的 `.git` 目录，并监听其中的 `HEAD` 文件。普通仓库、worktree、submodule 切分支后链接均自动重新解析，模板里的 `git.branch` 始终与编辑器状态栏保持一致。
- 监听只要求 `PATH` 中能找到 `git` 命令——这是解析器原本就有的前提。**不依赖** `vscode.git` 扩展；即使设置了 `"git.enabled": false`，自动刷新依然工作。
- 如果某个工作区文件夹不在 git 仓库内，会被静默跳过（解析器本身在该文件夹下也无可渲染内容）。后续通过 **File → Add Folder to Workspace** 加入的文件夹会自动接入监听。
- CLI (`vscode-links`) 和 Node 插件 (`@vscode-links/native`) 每次调用都会重新读取 git 状态，因此始终反映当前分支。

示例

- 使用 GitHub owner 与 repo：

  `https://github.com/{{repoSpecific.github.owner}}/{{repoSpecific.github.repo}}/tree/{{git.branch}}`

- 使用 CNB 的 groups：

  `https://cnb.example.com/{{repoSpecific.cnb.groups}}/{{repoSpecific.cnb.repo}}`
