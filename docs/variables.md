# Template variables

This document lists the variables that the template engine injects into template contexts by the built-in providers. Use these names directly inside your templates (for example: `{{repo.url}}`, `{{repoSpecific.github.owner}}`).

Reserved behavior

- All provider raw fragments are preserved under the special `_raw` key using the provider `id` as the sub-key. For example `_raw.cnb`, `_raw.github` contain the original fragment each provider returned.

Built-in providers

1. git

- `repo.url` — the repository remote URL discovered for the current workspace.
- `git.branch` — the current branch name.
- `workspace.fileRelativePath` — the path of the current file relative to the workspace root.

Example:

- `{{repo.url}}` → `https://github.com/owner/repo.git`
- `{{git.branch}}` → `main`
- `{{workspace.fileRelativePath}}` → `src/commands/open/cnb/index.ts`

2. cnb

Injected under `repoSpecific.cnb`:

- `repoSpecific.cnb.repo` — repository name parsed from a CNB repo URL.
- `repoSpecific.cnb.groups` — groups joined by `/` (string). Example: `group/subgroup`.

Raw fragment: `_raw.cnb` contains the original parsed object the provider returned.

3. github

Injected under `repoSpecific.github`:

- `repoSpecific.github.owner` — repository owner (user or org).
- `repoSpecific.github.repo` — repository name.

Raw fragment: `_raw.github` contains the original parsed object the provider returned.

4. coding

Injected under `repoSpecific.coding`:

- `repoSpecific.coding.team` — Coding team name.
- `repoSpecific.coding.project` — Coding project name.
- `repoSpecific.coding.repo` — Coding repository name.

Raw fragment: `_raw.coding` contains the original parsed object the provider returned.

Usage notes

- The engine shallowly merges provider fragments; later providers (registered later) override keys provided earlier if the same top-level key exists.
- Use `_raw.{providerId}` to access the original provider fragment if you need provider-specific shapes that are not flattened or transformed by the engine.
- If no provider matches the `repoUrl` or a provider throws, the engine silently continues and that provider's fields will be absent from the context (a warning is logged).

Auto-refresh on git changes

- The VS Code extension resolves each workspace folder's real `.git` directory via `git rev-parse --absolute-git-dir` at startup and watches `HEAD` inside it. Branch switches in plain repos, worktrees, and submodules all re-resolve links automatically, so templates that reference `git.branch` stay in sync with the editor's status bar.
- The watcher requires `git` to be on `PATH` — the same prerequisite the resolver already has. There is no dependency on the `vscode.git` extension; auto-refresh works even with `"git.enabled": false`.
- If a workspace folder is not inside a git repository, that folder is silently skipped (the resolver also has nothing to render for it). Folders added later via **File → Add Folder to Workspace** are picked up automatically.
- The CLI (`vscode-links`) and Node addon (`@vscode-links/native`) read git state on every call, so they always reflect the current branch.

Examples

- Template using GitHub owner and repo:

  `https://github.com/{{repoSpecific.github.owner}}/{{repoSpecific.github.repo}}/tree/{{git.branch}}`

- Template using CNB groups:

  `https://cnb.example.com/{{repoSpecific.cnb.groups}}/{{repoSpecific.cnb.repo}}`
