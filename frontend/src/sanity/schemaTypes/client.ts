import { createClient } from '@sanity/client'

export const client = createClient({
  projectId: 'gzi0w9zf',
  dataset: 'production',
  apiVersion: '2026-01-01',
  useCdn: true,
})