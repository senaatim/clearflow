'use client'

import dynamic from 'next/dynamic'
import config from '@/../sanity.config' // Or update based on where sanity.config.ts sits

const NextStudio = dynamic(
  () => import('next-sanity/studio').then((mod) => mod.NextStudio),
  { ssr: false }
)

export default function StudioPage() {
  return <NextStudio config={config} />
}