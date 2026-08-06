import { ComingSoonMain } from "./ComingSoonMain"

/**
 * lazy-club.com coming soon 페이지 (라운드 30 신설 · 33/37/41 개편)
 * — 내비 + 워드서치 그리드(폰트 조판) + COMING SOON 타이핑 + 푸터(내부 홈과 동일).
 * 셸은 ComingSoonMain이 직접 감싼다 (클라이맥스에서 팔레트를 반전하기 위함).
 * 파비콘·OG는 상위 layout.tsx(레이지클럽 메타)를 그대로 상속.
 * lazy-club.com 호스트는 middleware가 모든 경로를 이 페이지로 rewrite.
 */
export default function LazyClubComingSoonPage() {
  return <ComingSoonMain />
}
