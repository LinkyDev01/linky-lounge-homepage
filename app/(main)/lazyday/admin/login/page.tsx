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
  // 거절 사유는 **어디가 끊겼는지**를 말해야 한다 — 한 마디로 뭉개면 진단에 라운드를 쓴다
  const denied = searchParams.get("denied")
  // exchange 는 사유 코드(reason)까지 온다 (2026-09-02, lib/auth-server.ts) — 환경변수 오류는 **무엇을 어디에 다시 넣을지**까지 말한다.
  // 실측: SUPABASE_ANON_KEY 에 대시보드의 마스킹 표시값(eyJ…••••)이 들어가 하루 종일 "교환 실패"만 보였다.
  const reason = searchParams.get("reason") ?? ""
  const exchangeMsg =
    reason === "malformed" ? "서버의 SUPABASE_ANON_KEY 가 키 모양이 아니에요 — Supabase 대시보드에서 마스킹된 값(eyJ…••••)을 그대로 복사한 경우예요. Project Settings → API Keys 에서 anon 키를 '표시'한 뒤 전체를 복사해 Vercel 환경변수에 다시 넣고 재배포해 주세요."
    : reason === "wrongrole" ? "SUPABASE_ANON_KEY 자리에 다른 역할의 키가 들어 있어요 — anon(publishable) 키여야 해요. service_role 키는 절대 여기 넣지 마세요."
    : reason === "missing" || reason === "disabled" ? "서버에 SUPABASE_URL·SUPABASE_ANON_KEY 가 설정되지 않았어요 — Vercel 환경변수(Production·Preview)에 넣고 재배포해 주세요."
    : reason === "key" ? "서버가 Supabase 에 요청을 보내지 못했어요 — 환경변수 값에 헤더에 실을 수 없는 문자가 섞여 있어요. SUPABASE_URL·SUPABASE_ANON_KEY 를 다시 붙여넣어 주세요."
    : reason === "verifier" ? "로그인 시작 쿠키가 없어요 — 뒤로 가기·새로고침으로 돌아오거나 다른 브라우저에서 이어 간 경우예요. 버튼을 다시 눌러 주세요."
    : reason === "flowstate" ? "로그인 코드가 만료됐거나 이미 사용됐어요 — 버튼을 다시 눌러 주세요."
    : reason === "network" ? "Supabase 인증 서버에 연결하지 못했어요 — 잠시 후 다시 시도해 주세요."
    : reason === "provider" ? "소셜 서비스가 로그인을 거절했어요(동의 취소 등) — 다시 시도해 주세요."
    : reason === "nocode" ? "소셜 서비스에서 로그인 코드 없이 돌아왔어요 — 버튼을 다시 눌러 주세요."
    : reason === "start" ? "로그인을 시작하지 못했어요 — 잠시 후 다시 시도해 주세요."
    : `로그인 교환에 실패했어요${reason ? ` (사유 ${reason})` : ""}. Supabase 의 Redirect URLs 에 이 주소가 있는지 확인해 주세요 — https://admin.lazy-club.com/api/auth/callback`
  const deniedMsg =
    denied === "notallowed" ? "이 계정은 관리자 목록에 없어요. Vercel 의 ADMIN_EMAILS 에 이 이메일을 넣어 주세요."
    : denied === "noallowlist" ? "ADMIN_EMAILS 가 비어 있어요 — Vercel 환경변수에 관리자 이메일을 넣고 재배포해 주세요."
    : denied === "noemail" ? "소셜 계정에서 이메일을 못 받았어요. 카카오는 '카카오계정(이메일)' 동의항목이 필요해요."
    : denied === "exchange" ? exchangeMsg
    : denied === "nocookie" ? "브라우저가 로그인 쿠키를 저장하지 못했어요 — 시크릿 창이나 쿠키 차단 설정을 확인해 주세요."
    : denied === "nosession" ? "로그인 세션이 만료됐어요 — 다시 시도해 주세요."
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
