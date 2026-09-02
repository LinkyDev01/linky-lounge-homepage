"use client"

/**
 * 관리 셸 — 좌 내비 6 + 본문 (2026-09-02, 대시보드 CRM-3 · 통합안 이식).
 * 내비: 홈 · 고객 · 접수 · 주문 · 일정 · 도구 — '파이프라인'은 홈이 곧 그것이라 따로 없다(DECISIONS).
 * 링크는 어느 호스트에서든 깔끔한 `/admin/*` (관리 호스트·프리뷰·localhost 전부 rewrite 가 받는다).
 * 아직 옮기지 않은 화면(접수·일정·도구)은 종전 페이지로 링크만 — 겉모습이 다른 건 이행 중이라서다.
 */

import { usePathname, useRouter } from "next/navigation"
import type { ReactNode } from "react"
import styles from "./crm.module.css"

const NAV: { href: string; label: string; match: (p: string) => boolean }[] = [
  { href: "/admin", label: "홈", match: (p) => /\/admin\/?$/.test(p) },
  { href: "/admin/customers", label: "고객", match: (p) => p.includes("/admin/customers") },
  { href: "/admin/applications", label: "접수", match: (p) => p.includes("/admin/applications") },
  { href: "/admin/orders", label: "주문", match: (p) => p.includes("/admin/orders") },
  { href: "/admin/schedule", label: "일정", match: (p) => p.includes("/admin/schedule") },
  { href: "/admin/status", label: "도구", match: (p) => p.includes("/admin/status") || p.includes("/admin/simulate") },
]

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || ""
  const router = useRouter()
  async function logout() {
    await fetch("/api/lazyday/admin/auth", { method: "DELETE" })
    router.replace("/admin/login")
  }
  return (
    <div className={styles.root}>
      <div className={styles.shell}>
        <nav className={styles.nav}>
          <p className={styles.brand}>레이지클럽 관리<small>admin.lazy-club.com</small></p>
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className={`${styles.navItem} ${n.match(pathname) ? styles.navOn : ""}`}>{n.label}</a>
          ))}
          <div className={styles.navSep} />
          <a href="/admin/status" className={styles.navItem}>상태 점검</a>
          <a href="/admin/simulate" className={styles.navItem}>흐름 테스트</a>
          <p className={styles.navFoot}><button onClick={logout}>로그아웃</button></p>
        </nav>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  )
}

/** 관리 API 호출 공통 — 401 이면 로그인으로. 던지지 않고 null */
export async function adminFetch<T>(url: string, router: ReturnType<typeof useRouter>): Promise<T | null> {
  const res = await fetch(url, { cache: "no-store" })
  if (res.status === 401) { router.replace("/admin/login"); return null }
  return (await res.json()) as T
}
