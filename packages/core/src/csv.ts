import axios from 'axios'
import papaParse from 'papaparse'

import type { RemoteLinkResource } from './schemas'

export interface FetchCsvOptions {
  /** Per-request timeout in milliseconds. Defaults to 5000. */
  timeoutMs?: number
}

export async function getLinksResourcesFromRemoteCsv(url: string, options: FetchCsvOptions = {}) {
  const response = await axios.get(url, {
    timeout: options.timeoutMs ?? 5000,
  })
  const csvData = response.data

  const result = papaParse.parse<RemoteLinkResource>(csvData, {
    header: true,
  })

  return {
    data: result.data,
    errors: result.errors,
  }
}
