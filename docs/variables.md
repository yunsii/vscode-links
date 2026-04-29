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

- The VS Code extension subscribes to the built-in `vscode.git` extension and re-resolves links whenever a repository's `HEAD` (branch or commit) changes, so templates that reference `git.branch` stay in sync with the editor's status bar.
- Detection requires the built-in Git extension to be enabled. If you have set `"git.enabled": false` or are running a distribution that does not ship `vscode.git`, branch switches will not trigger an auto-refresh — run **Links: Refresh** (`links.refresh`) manually after switching branches.
- The CLI (`vscode-links`) and Node addon (`@vscode-links/native`) read git state on every call, so they always reflect the current branch.

Examples

- Template using GitHub owner and repo:

  `https://github.com/{{repoSpecific.github.owner}}/{{repoSpecific.github.repo}}/tree/{{git.branch}}`

- Template using CNB groups:

  `https://cnb.example.com/{{repoSpecific.cnb.groups}}/{{repoSpecific.cnb.repo}}`
