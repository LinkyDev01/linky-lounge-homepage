"use client"

import { useState, type FormEvent, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import styles from "./login.module.css"
import { safeNext } from "@/app/api/auth/_next"

function LoginForm() {
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
      // 같은 오리진 경로만 — 로그인 링크는 누구나 만들어 보낼 수 있다 (open redirect 차단, 2026-09-02)
      const redirect = safeNext(searchParams.get("redirect") || "/admin")
      router.replace(redirect === "/" ? "/admin" : redirect)
    } else {
      setError(data.error || "오류가 발생했습니다.")
      setLoading(false)
    }
  }

  // 소셜 로그인 → 회원용 경로를 그대로 타고 → 관리자 허용 목록 대조(/api/lazyday/admin/auth/social)
  const redirectParam = safeNext(searchParams.get("redirect") || "/admin")
  const social = (provider: "kakao" | "google") =>
    `/api/auth/signin/${provider}?next=${encodeURIComponent(`/api/lazyday/admin/auth/social?redirect=${encodeURIComponent(redirectParam)}`)}`
  const denied = searchParams.get("denied")
  const deniedMsg =
    denied === "notallowed" ? "이 계정은 관리자 목록에 없어요. (Vercel ADMIN_EMAILS)"
    : denied === "nosession" ? "로그인 세션을 못 받았어요 — 다시 시도해 주세요."
    : denied === "unconfigured" ? "ADMIN_SECRET 이 설정되지 않았어요."
    : ""

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <h1 className={styles.title}>관리자 로그인</h1>
      <a className={styles.social} href={social("kakao")}>카카오로 로그인</a>
      <a className={styles.social} href={social("google")}>구글로 로그인</a>
      {deniedMsg && <p className={styles.error}>{deniedMsg}</p>}
      <p className={styles.or}>또는 비밀번호 — 소셜 로그인이 자리 잡으면 사라집니다</p>
      <input
        type="password"
        className={styles.input}
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? "확인 중..." : "로그인"}
      </button>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <main className={styles.page}>
      <Suspense fallback={<div className={styles.card} />}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
