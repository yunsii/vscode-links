import axios from 'axios'
import papaParse from 'papaparse'

import type { RemoteLinkResource } from './schemas'

export async function getLinksResourcesFromRemoteCsv(url: string) {
  const response = await axios.get(url)
  const csvData = response.data

  const result = papaParse.parse<RemoteLinkResource>(csvData, {
    header: true,
  })

  return {
    data: result.data,
    errors: result.errors,
  }
}
