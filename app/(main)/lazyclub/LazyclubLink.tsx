"use client"

import Link from "next/link"
import type { ComponentProps } from "react"
import { useSyncExternalStore } from "react"
import { useBasePath } from "@/hooks/use-base-path"
import { BASE } from "./base-path"

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string }

/** lazy-club.com 은 레이지클럽이 **도메인 루트**다 — 미들웨어가 `/meetings` 를
 *  `/lazyclub/meetings` 로 rewrite 하므로, 이 도메인에서는 링크에서 프리픽스를 뗀다
 *  (붙여 두면 클릭마다 301 한 번을 더 타고 주소창에도 군더더기가 남는다). */
const LAZYCLUB_HOSTS = ["lazy-club.com", "www.lazy-club.com"]
const subscribe = () => () => {}
const isLazyclubHost = () =>
  typeof window !== "undefined" && LAZYCLUB_HOSTS.includes(window.location.hostname)

/**
 * 레이지클럽 트리 전용 내부 링크 (2026-08-21 프리뷰 졸업과 함께 신설).
 *
 * 트리가 `/lazyday` **밖**(`/lazyclub`)으로 나오면서 LazyclubLink 를 그대로 쓸 수 없게 됐다 —
 * 그 컴포넌트는 호스트에 따라 `/lazyday` 를 앞에 붙이는데, 붙이면 `/lazyday/lazyclub/...`
 * 라는 없는 경로가 된다(2026-08-21 실측 버그). 그래서 **목적지에 따라 갈라 준다**:
 *   · `/lazyclub/…`  = 이 트리 안 → 프리픽스 없음. 단 lazy-club.com 에선 프리픽스를 뗀다
 *   · 그 외(`/one-day-talk-01/…`, `/terms` 등 책클럽 트리) → 종전 LazyclubLink 규칙 그대로
 * 서버 스냅숏은 항상 "프리픽스 유지"라 하이드레이션 불일치 없이 클라이언트에서 보정된다
 * (useBasePath 와 같은 방식).
 */
export function LazyclubLink({ href, ...props }: Props) {
  const lazydayBase = useBasePath()
  const bare = useSyncExternalStore(subscribe, isLazyclubHost, () => false)

  let full: string
  if (href === BASE || href.startsWith(`${BASE}/`)) {
    full = bare ? href.slice(BASE.length) || "/" : href
  } else {
    full = href === "/" ? lazydayBase || "/" : `${lazydayBase}${href}`
  }
  return <Link href={full} {...props} />
}
