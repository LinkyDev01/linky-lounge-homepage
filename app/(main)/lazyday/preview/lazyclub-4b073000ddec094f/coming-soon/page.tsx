import { WorkroomShell } from "../Shell"
import { ComingSoonMain } from "./ComingSoonMain"

/**
 * lazy-club.com coming soon 페이지 (라운드 30 신설 · 33 개편)
 * — 내비 + 워드서치 그리드(폰트 조판) + COMING SOON 타이핑 + 푸터(내부 홈과 동일).
 * 파비콘·OG는 상위 layout.tsx(레이지클럽 메타)를 그대로 상속.
 * lazy-club.com 호스트는 middleware가 모든 경로를 이 페이지로 rewrite.
 */
export default function LazyClubComingSoonPage() {
  return (
    <WorkroomShell>
      <ComingSoonMain />
    </WorkroomShell>
  )
}
