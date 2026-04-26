# cli-installer

Holds the templated `install.sh.in` that the CLI release workflow
substitutes per release. The rendered `install.sh` is uploaded as a
release asset so users can:

```sh
curl -fsSL https://github.com/yunsii/vscode-links/releases/latest/download/install.sh | sh
```

This directory contains no runtime artefacts and is not published to
npm; it lives under `tools/` precisely so pnpm's workspace globber
ignores it.
