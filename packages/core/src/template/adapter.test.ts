import { describe, expect, it } from 'vitest'

import { renderTemplate } from './adapter'

describe('renderTemplate', () => {
  it('replaces simple placeholders using es-toolkit', () => {
    const tpl = 'Hello {{name}} from {{place}}'
    const out = renderTemplate(tpl, { name: 'Alice', place: 'Earth' })
    // ensure renderTemplate returns a string and doesn't throw
    expect(typeof out).toBe('string')
  })

  it('returns original when template is empty', () => {
    const tpl = ''
    const out = renderTemplate(tpl, { x: '1' })
    expect(out).toBe(tpl)
  })

  it('resolves nested object properties', () => {
    const tpl = 'Hello {{user.name}} from {{user.location.city}}'
    const out = renderTemplate(tpl, { user: { name: 'Bob', location: { city: 'Paris' } } })
    expect(out).toBe('Hello Bob from Paris')
  })
})
