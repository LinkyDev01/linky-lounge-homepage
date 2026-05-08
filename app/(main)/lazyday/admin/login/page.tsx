"use client"

import { useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import styles from "./login.module.css"

export default function AdminLoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)
  const router       = useRouter()
  const searchParams = useSearchParams()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res  = await fetch("/api/lazyday/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (data.success) {
      const redirect = searchParams.get("redirect") || "/lazyday/admin"
      router.replace(redirect)
    } else {
      setError(data.error || "오류가 발생했습니다.")
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>관리자 로그인</h1>
        <input
          type="password"
          className={styles.input}
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "확인 중..." : "로그인"}
        </button>
      </form>
    </main>
  )
}
