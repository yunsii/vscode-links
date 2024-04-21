import * as vscode from 'vscode'

type RegisterCommandParameters = Parameters<typeof vscode.commands.registerCommand>

export interface AddCommandOptions {
  name: RegisterCommandParameters[0]
  handler: RegisterCommandParameters[1]
}

export function addCommand(context: vscode.ExtensionContext, options: AddCommandOptions) {
  context.subscriptions.push(vscode.commands.registerCommand(options.name, options.handler))
}
