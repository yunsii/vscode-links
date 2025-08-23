import { expect, it } from 'vitest'

import { getLinksResourcesFromRemoteCsv } from './csv'

it('should parse remote CSV and return data', async () => {
  const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRlzHErycXFRcNf2u9kB3SndusKyGaAEmoh2gueEKEtkTaibfMKKgOonlJhgBArqKrKJJlXthTo7LFN/pub?gid=0&single=true&output=csv'
  const result = await getLinksResourcesFromRemoteCsv(url)

  expect(result).toHaveProperty('data')
  expect(result.data.length).toBeGreaterThan(0)
  expect(result).toHaveProperty('errors')
})
