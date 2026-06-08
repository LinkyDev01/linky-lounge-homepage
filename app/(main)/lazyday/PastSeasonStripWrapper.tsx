"use client"

import { useEffect, useState } from "react"
import { BookCoverStrip } from "./BookCoverStrip"
import { season2Config } from "./book-config"

export function PastSeasonStripWrapper() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const details = document.getElementById("past-seasons") as HTMLDetailsElement | null
    if (!details) return
    const handleToggle = () => setOpen(details.open)
    details.addEventListener("toggle", handleToggle)
    setOpen(details.open)
    return () => details.removeEventListener("toggle", handleToggle)
  }, [])

  if (!open) return null
  return <BookCoverStrip books={season2Config.books} seasonPrefix="s2" isSticky />
}
