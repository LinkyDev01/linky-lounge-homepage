"use client"

import { useEffect, useState } from "react"
import { BookCoverStrip } from "./BookCoverStrip"
import { season1Config, season2Config } from "./book-config"

type PastSeason = "s1" | "s2"

export function PastSeasonStripWrapper() {
  const [open, setOpen] = useState(false)
  const [activeSeason, setActiveSeason] = useState<PastSeason>("s2")

  useEffect(() => {
    const details = document.getElementById("past-seasons") as HTMLDetailsElement | null
    if (!details) return

    const handleToggle = () => setOpen(details.open)
    details.addEventListener("toggle", handleToggle)
    setOpen(details.open)

    const handleSeasonChange = (e: Event) => {
      const season = (e as CustomEvent<{ season: PastSeason }>).detail?.season
      if (season === "s1" || season === "s2") setActiveSeason(season)
    }
    window.addEventListener("pastSeasonChange", handleSeasonChange)

    return () => {
      details.removeEventListener("toggle", handleToggle)
      window.removeEventListener("pastSeasonChange", handleSeasonChange)
    }
  }, [])

  if (!open) return null

  const config = activeSeason === "s1" ? season1Config : season2Config
  return <BookCoverStrip books={config.books} seasonPrefix={activeSeason} isSticky />
}
