import { WorkroomHome } from "../WorkroomHome"

/**
 * lazy-club.com coming soon 페이지 (라운드 30)
 * — 내비 + 워드서치 마크 + 둥근모꼴 타이핑(B안) + 사업자정보 푸터.
 * 파비콘·OG는 상위 layout.tsx(레이지클럽 메타)를 그대로 상속.
 * lazy-club.com 호스트는 middleware가 모든 경로를 이 페이지로 rewrite.
 */
export default function LazyClubComingSoonPage() {
  return <WorkroomHome comingSoon />
}
