"use client"

import { useSyncExternalStore } from "react"

// 미들웨어가 깔끔한 경로(/…)를 내부 /lazyday/… 로 rewrite 해 주는 호스트들.
// lazy-club.com도 같은 방식이라 프리픽스를 붙이지 않는다 (라운드 64)
const BOOKCLUB_HOSTS = ["lazyday-bookclub.com", "www.lazyday-bookclub.com", "lazy-club.com", "www.lazy-club.com"]

function getClientBase() {
  if (typeof window === "undefined") return "/lazyday"
  return BOOKCLUB_HOSTS.includes(window.location.hostname) ? "" : "/lazyday"
}

const subscribe = () => () => {}

/**
 * 책클럽 콘텐츠의 경로 프리픽스를 호스트에 맞게 반환한다.
 * - linkylounge.com 등: "/lazyday" (실제 경로)
 * - lazyday-bookclub.com: "" (미들웨어가 /lazyday로 rewrite → 깔끔한 경로 사용)
 * 서버/하이드레이션 스냅샷은 항상 "/lazyday"라 불일치 경고 없이 클라이언트에서 보정된다.
 */
export function useBasePath() {
  return useSyncExternalStore(subscribe, getClientBase, () => "/lazyday")
}
