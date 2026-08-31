import { WorkroomHome } from "../WorkroomHome"

/**
 * /lazyclub/all — 레이지클럽 **전체보기** 홈 (전면 대개편 v3, 워크룸 이식판).
 * 2026-08-21: 프리뷰 졸업 + URL 명명 규칙 확정 — 경로 슬러그는 **내비 라벨의 영문 대응어**다
 * (전체보기=all · 모임=meetings · 제품=products · 사람=people · 일정=schedule · 기록=records).
 * 홈이 트리 루트가 아니라 이름을 갖는 이유: lazy-club.com 에서 프리픽스를 떼면 트리 루트가
 * `/` 가 되는데 그 자리는 아직 coming-soon 이라 홈이 갈 곳을 잃는다(2026-08-21 실측 회귀).
 * 내비는 영문 단일 확정(Bookclub / One Day Talk / Brand — 운영자 2026-08-04)
 * → 기존 ?nav=ko|en 두 벌 체계는 종료
 */
export default function HomeV3WorkroomPage() {
  return <WorkroomHome />
}
