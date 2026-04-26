// CJS counterpart of index.js, byte-equivalent in behaviour.
// Vendored separately because the bundled VSIX is CJS and Node's
// `exports.require` cannot point at an ESM file.

const { existsSync } = require('node:fs')
const { join } = require('node:path')
const process = require('node:process')

function detectTriple() {
  const { platform, arch } = process
  if (platform === 'linux') {
    return arch === 'arm64' ? 'linux-arm64-gnu' : 'linux-x64-gnu'
  }
  if (platform === 'darwin') {
    return arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64'
  }
  if (platform === 'win32') {
    return 'win32-x64-msvc'
  }
  throw new Error(`@vscode-links/native: unsupported platform ${platform}/${arch}`)
}

function loadAddon() {
  const triple = detectTriple()
  const local = join(__dirname, `vscode-links.${triple}.node`)
  if (existsSync(local)) {
    return require(local)
  }
  return require(`@vscode-links/native-${triple}`)
}

const addon = loadAddon()

function resolve(options) {
  return addon.resolveSync(options)
}

function renderTemplate(template, context) {
  return addon.renderTemplateSync(template, context)
}

module.exports = { resolve, renderTemplate }
