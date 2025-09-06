import * as vscode from 'vscode'

import type { LinkResourceType } from './schemas'

const iconCache = new Map<LinkResourceType, vscode.ThemeIcon>()

export function getIconForType(type: LinkResourceType): vscode.ThemeIcon {
  if (iconCache.has(type)) {
    return iconCache.get(type)!
  }

  const icon = createIconForType(type)
  iconCache.set(type, icon)
  return icon
}

function createIconForType(type: LinkResourceType): vscode.ThemeIcon {
  const config = vscode.workspace.getConfiguration('links')
  const customIcons = config.get<Record<string, string>>('customIcons') || {}

  const iconName = customIcons[type] || getDefaultIconName(type)
  return new vscode.ThemeIcon(iconName)
}

function getDefaultIconName(type: LinkResourceType): string {
  switch (type) {
    case 'local':
      return 'folder'
    case 'detected':
      return 'eye'
    case 'remote-project':
      return 'repo'
    case 'remote-shared':
      return 'share'
    default:
      return 'folder'
  }
}
