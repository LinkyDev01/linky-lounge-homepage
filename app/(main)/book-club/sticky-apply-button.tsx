"use client"

import { useEffect, useState } from "react"
import { ApplyButton } from "./apply-button"
import styles from "./page.module.css"

export function StickyApplyButton() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const target = document.getElementById("closing-section")
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return (
    <div className={`${styles.fixedButtonContainer}${!visible ? ` ${styles.fixedButtonContainerHidden}` : ""}`}>
      <ApplyButton />
    </div>
  )
}
