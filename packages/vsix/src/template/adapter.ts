import { template as _template } from 'es-toolkit/compat'

import type { JsonObject } from 'type-fest'

export function renderTemplate(template: string, context: JsonObject): string {
  if (!template || typeof template !== 'string') {
    return template
  }

  return _template(template, {
    interpolate: /\{\{([\s\S]+?)\}\}/g,
  })(context)
}
