"use client"

import Link from "next/link"
import type { ComponentProps } from "react"
import { useBasePath } from "@/hooks/use-base-path"
import { BASE } from "./base-path"

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string }

/**
 * 레이지클럽 트리 전용 내부 링크 (2026-08-21 프리뷰 졸업과 함께 신설).
 *
 * 트리가 `/lazyday` **밖**(`/lazyclub`)으로 나오면서 LazydayLink 를 그대로 쓸 수 없게 됐다 —
 * 그 컴포넌트는 호스트에 따라 `/lazyday` 를 앞에 붙이는데, 붙이면 `/lazyday/lazyclub/...`
 * 라는 없는 경로가 된다(2026-08-21 실측 버그). 그래서 **목적지에 따라 갈라 준다**:
 *   · `/lazyclub/…`  = 이 트리 안 → **어떤 호스트에서도 그대로**
 *   · 그 외(`/one-day-talk-01/…`, `/terms` 등 책클럽 트리) → 종전 LazydayLink 규칙 그대로
 *
 * ⚠ 한때 lazy-club.com 에서만 `/lazyclub` 프리픽스를 떼도록 했다가 되돌렸다 —
 *   그 도메인의 랜딩(`/`)이 아직 coming-soon 이라, 프리픽스를 떼면 내비 '전체보기'가
 *   홈이 아니라 coming-soon 으로 떨어졌다(2026-08-21 실측 회귀). 프리픽스 없는 주소도
 *   미들웨어 rewrite 로 계속 열리므로 **링크는 한 모양으로 통일**하는 편이 안전하다.
 */
export function LazyclubLink({ href, ...props }: Props) {
  const lazydayBase = useBasePath()
  const inTree = href === BASE || href.startsWith(`${BASE}/`)
  const full = inTree ? href : href === "/" ? lazydayBase || "/" : `${lazydayBase}${href}`
  return <Link href={full} {...props} />
}
