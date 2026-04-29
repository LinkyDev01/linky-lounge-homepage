'use client'

import { useEffect, useState } from 'react'

export function PastSeasonStripWrapper({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const details = document.getElementById('past-seasons') as HTMLDetailsElement | null
    if (!details) return
    const handleToggle = () => setOpen(details.open)
    details.addEventListener('toggle', handleToggle)
    setOpen(details.open)
    return () => details.removeEventListener('toggle', handleToggle)
  }, [])

  if (!open) return null
  return <>{children}</>
}
