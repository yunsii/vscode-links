import { addLinksOpenCommand } from './commands/open'

import type * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  addLinksOpenCommand(context)
}

export function deactivate() {

}
