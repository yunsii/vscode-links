# Releasing

Three independent release trains. Each has its own version source, its
own tag prefix, and its own GitHub Actions workflow. Bumping is always
done through `scripts/bump.mjs` (wrapped as `pnpm release:<train>
<semver>`); commits and tags remain manual so the diff can be reviewed.

| Train    | Tag         | Workflow                               | Lands on                                           |
| -------- | ----------- | -------------------------------------- | -------------------------------------------------- |
| `cli`    | `cli-v*`    | `.github/workflows/cli-release.yml`    | GitHub Releases (5 archives + `install.sh`)        |
| `native` | `native-v*` | `.github/workflows/native-release.yml` | npm (5 per-arch packages + `@vscode-links/native`) |
| `vsix`   | `v*`        | `.github/workflows/release.yml`        | VS Code Marketplace + Open VSX + GitHub Releases   |

## One-time setup (before any train ships)

1. **Repository secrets** (Settings → Secrets and variables → Actions):
   - `NPM_TOKEN` — npm "Automation" token. Required only for the very
     first `native-v*` publish; gets removed after step 6 below.
   - `VSCE_PAT` — Azure DevOps PAT with marketplace `Manage` scope.
     Permanent.
   - `OVSX_PAT` — Open VSX user token. Permanent.

2. **npm scope ownership**: confirm `@vscode-links` is registered to
   you (or to an org you own). `npm org ls @vscode-links` should list
   your account.

3. **Marketplace publisher**: confirm the `yuns` publisher exists and
   is verified at <https://marketplace.visualstudio.com/manage>.

4. **Open VSX namespace**: confirm `yuns` is registered at
   <https://open-vsx.org/user-settings/namespaces>.

## Cutting a release

```sh
# Choose the train, pick a semver, run the bump.
pnpm release:cli 0.2.0           # or: release:native, release:vsix

# Review the diff and commit the bump in its own commit.
git diff --stat
git commit -am "chore(release): bump cli to 0.2.0"

# Tag using the train's prefix (cli-v / native-v / v).
git tag cli-v0.2.0
git push --follow-tags
```

The matching workflow picks up the tag, builds the per-target matrix,
and publishes. Watch progress with `gh run watch` or `gh run list
--workflow <name>.yml`.

## First `native-v*` publish (token-based) → trusted-publisher handover

The very first time `@vscode-links/native` and its five per-arch
siblings are published, npm has no trusted-publisher record for them
yet, so the workflow falls back to `NPM_TOKEN`. After that one
publish, switch each package to OIDC and remove the token.

1. Set `NPM_TOKEN` in repo secrets (one-time).

2. Bump and tag as usual:

   ```sh
   pnpm release:native 0.1.0
   git commit -am "chore(release): bump native to 0.1.0"
   git tag native-v0.1.0 && git push --follow-tags
   ```

3. Wait for `Native Release` workflow to publish all six packages with
   `NODE_AUTH_TOKEN` + `--provenance`. Each publish already attaches
   an OIDC build attestation (visible on the package page).

4. On <https://www.npmjs.com>, for **each** of the six packages:
   - Open the package page → Settings → Publishing access.
   - Under "Trusted Publisher", click **Add publisher**.
   - Fill: GitHub user/org `yunsii`, repo `vscode-links`, workflow
     `.github/workflows/native-release.yml`. Leave Environment empty
     unless you've configured one.

   The six packages:

   ```
   @vscode-links/native
   @vscode-links/native-linux-x64-gnu
   @vscode-links/native-linux-arm64-gnu
   @vscode-links/native-darwin-x64
   @vscode-links/native-darwin-arm64
   @vscode-links/native-win32-x64-msvc
   ```

5. Edit `.github/workflows/native-release.yml`:
   - Drop the two `env:` blocks (`NODE_AUTH_TOKEN: ...`).
   - Leave the `--provenance --access public` flags as-is.
   - The `permissions: id-token: write` block is what authorises npm
     to verify the OIDC token; keep it.

6. Delete the `NPM_TOKEN` secret from repo settings.

7. Cut the next `native-v*` release; the publish step now uses OIDC
   exclusively.

## CLI and VSIX releases (no OIDC handover required)

`cli-release.yml` uses `softprops/action-gh-release@v2` with the
default `GITHUB_TOKEN` — no separate token, no transition needed.

`release.yml` (VSIX) needs `VSCE_PAT` + `OVSX_PAT` permanently;
neither marketplace currently supports OIDC.

## Cancelling a stuck release

```sh
# Find the run id
gh run list --workflow native-release.yml --limit 5
# Cancel it
gh run cancel <run-id>
```

`gh run rerun <run-id>` will re-run a failed leg without re-tagging.
For a re-tag (e.g. you want to overwrite `cli-v0.2.0`), delete the
remote tag (`git push --delete origin cli-v0.2.0`) and the GitHub
Release before pushing again — npm publishes are immutable once
landed and require a new patch version.
