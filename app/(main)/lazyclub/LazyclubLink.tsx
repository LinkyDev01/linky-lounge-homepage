"use client"

import Link from "next/link"
import type { ComponentProps } from "react"
import { useSyncExternalStore } from "react"
import { useBasePath } from "@/hooks/use-base-path"
import { BASE } from "./base-path"

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string }

/**
 * 레이지클럽 트리 전용 내부 링크 (2026-08-21 프리뷰 졸업과 함께 신설).
 *
 * 트리가 `/lazyday` **밖**(`/lazyclub`)으로 나오면서 LazydayLink 를 그대로 쓸 수 없게 됐다 —
 * 그 컴포넌트는 호스트에 따라 `/lazyday` 를 앞에 붙이는데, 붙이면 `/lazyday/lazyclub/...`
 * 라는 없는 경로가 된다(2026-08-21 실측 버그). 그래서 **목적지에 따라 갈라 준다**:
 *   · `/lazyclub/…`  = 이 트리 안 → **lazy-club.com 에서는 프리픽스를 뗀다**
 *     (그 도메인은 이미 레이지클럽이라 `lazy-club.com/lazyclub/…` 은 군더더기)
 *   · 그 외(`/one-day-talk-01/…`, `/terms` 등 책클럽 트리) → 종전 LazydayLink 규칙 그대로
 *
 * ⚠ 프리픽스 제거는 **홈이 이름(`/all`)을 갖게 된 뒤에야 안전하다** — 홈이 트리 루트였을
 *   때 이 처리를 켰다가, 벗겨낸 주소 `/` 가 랜딩(coming-soon)과 겹쳐 내비 '전체보기'가
 *   실종된 적이 있다(2026-08-21 실측 회귀). 서버 스냅숏은 항상 "프리픽스 유지"라
 *   하이드레이션 불일치 없이 클라이언트에서 보정된다 (useBasePath 와 같은 방식).
 */
const LAZYCLUB_HOSTS = ["lazy-club.com", "www.lazy-club.com"]
const subscribe = () => () => {}
const isLazyclubHost = () =>
  typeof window !== "undefined" && LAZYCLUB_HOSTS.includes(window.location.hostname)

export function LazyclubLink({ href, ...props }: Props) {
  const lazydayBase = useBasePath()
  const bare = useSyncExternalStore(subscribe, isLazyclubHost, () => false)
  const inTree = href === BASE || href.startsWith(`${BASE}/`)

  let full: string
  if (inTree) {
    full = bare ? href.slice(BASE.length) || "/" : href
  } else {
    full = href === "/" ? lazydayBase || "/" : `${lazydayBase}${href}`
  }
  return <Link href={full} {...props} />
}
