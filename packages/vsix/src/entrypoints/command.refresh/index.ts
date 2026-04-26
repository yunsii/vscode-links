import { useCommand } from 'reactive-vscode'

import { commands } from '../../generated/meta'
import { linksStore } from '../../store/links'

export function addCommandRefresh() {
  useCommand(commands.refresh, () => {
    linksStore.refresh()
  })
}
