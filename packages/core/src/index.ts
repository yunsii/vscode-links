// Public surface of @vscode-links/core. Both the VSIX and the standalone
// CLI consume this module; nothing in here may import from `vscode`.

export { getLinksResourcesFromRemoteCsv } from './csv'

export { getErrorMessage } from './errors'
export { getCurrentBranch, getCurrentRepoUrl } from './git'
export {
  ensureCnbRepoUrl,
  getCnbCurrentBranchUrl,
  getCnbCurrentFileUrl,
  getCnbRepoBaseUrls,
  getCnbRepoLinks,
  parseCnbRepoUrl,
} from './providers/cnb'
export {
  ensureCodingRepoUrl,
  getCodingFileUrl,
  getCodingRepoBaseUrls,
  getCodingRepoLinks,
  parseCodingRepoUrl,
} from './providers/coding'

export {
  ensureGitHubRepoUrl,
  getGitHubCurrentBranchUrl,
  getGitHubCurrentFileUrl,
  getGitHubRepoBaseUrls,
  getGitHubRepoLinks,
  parseGitHubRepoUrl,
} from './providers/github'

export type { BaseLinkResource, LinkResourceType, RemoteLinkResource } from './schemas'

export {
  ALLOWED_TEMPLATE_VARIABLES,
  renderTemplate,
  TemplateRenderError,
} from './template/adapter'
export type {
  AllowedTemplateVariable,
  TemplateRenderErrorReason,
} from './template/adapter'

export { buildContext, registerProvider, renderResource } from './template/engine'
export type { BuildContextEngineOptions, EngineLogger } from './template/engine'
export type {
  BuildContextOptions,
  TemplateContext,
  TemplateContextFragment,
  TemplateProvider,
} from './template/providers/types'
export { processLinkDisplay } from './url'
