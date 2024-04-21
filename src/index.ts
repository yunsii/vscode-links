import * as vscode from 'vscode'

import { getExtensionResources } from './helpers/config'

const command = 'links.open'

export function activate(context: vscode.ExtensionContext) {
  const commandHandler = async () => {
    const resources = getExtensionResources()
    if (!resources || resources.length === 0) {
      vscode.window.showWarningMessage('No links resources to open')
      return
    }

    const result = await vscode.window.showQuickPick(resources.map((item) => {
      return `${item.title} - ${item.url}`
    }), {
      placeHolder: 'Pick a url to open',
    })
    const target = resources.find((item) => {
      return `${item.title} | ${item.url}` === result
    })

    if (!target) {
      return
    }

    vscode.env.openExternal(vscode.Uri.parse(target.url))
  }

  context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler))
}

export function deactivate() {

}
