'use client'

import { useState, useEffect } from 'react'
import Loader from '@/components/landing/Loader'
import Hero from '@/components/landing/Hero'

// Total loader duration in ms before it exits
const LOADER_DURATION = 2600

export default function LandingPage() {
  const [loaderVisible, setLoaderVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoaderVisible(false), LOADER_DURATION)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* Cinematic loader — sits on top, exits after LOADER_DURATION */}
      <Loader visible={loaderVisible} />

      {/* Hero is always mounted; fades in as loader fades out */}
      <Hero />
    </>
  )
}
