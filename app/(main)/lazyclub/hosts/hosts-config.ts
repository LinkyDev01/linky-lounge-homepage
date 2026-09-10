/**
 * 호스트 모집 — 진열·상세가 함께 읽는 값 (2026-09-10, 운영자 제공 카드뉴스 5장 기준).
 *   1장 = 포스터(WE ARE HIRING — NEW LEADERS, 1080×1350 → 720 축소 webp)
 *   2~5장 = 소개 세 단락 · 모임 운영 안내 · 지원 시 필요 사항 · 지원 방법
 * 소비자: /hosts 상세(hosts/page.tsx) · /people 우측 카드(people/HostsAside.tsx)
 * ⚠ 표기는 '레이지클럽'(붙여 쓴다, 운영자 2026-09-10). 지시어 없는 모듈 — 서버·클라이언트 공용.
 */

export const HOSTS_POSTER = "/linky-lounge/book-club/home-v3/hosts-poster.webp"

/** 사람 페이지 우측 카드 문구 — 운영자 원문(2026-09-10 "위에 작은 글씨 '레이지클럽', 메인 제목 '호스트 모집 중'") */
export const HOSTS_CARD = { cat: "레이지클럽", name: "호스트 모집 중" } as const

/** 우측 요약(모임 운영 안내, 카드뉴스 3장 원문). '모집 마감'은 자리만 비워 둔 것 — 운영자 확정 대기 */
export const HOSTS_FIELDS: { label: string; lines: string[] }[] = [
  { label: "진행 횟수", lines: ["총 4회차"] },
  { label: "진행 시간", lines: ["각 회차 2시간"] },
  { label: "시작 일정", lines: ["10월 ~ 11월 중"] },
  { label: "진행 간격", lines: ["1주 또는 2주 간격 (선택 가능)"] },
  { label: "진행 장소", lines: ["사당, 을지로, 시청, 강남, 성수, 홍대 중 선택 가능"] },
  {
    label: "모임 주제",
    lines: ["자유 (단, 4회차 모임 간의 유기적인 연관성 필수)", "ex. '비로소, 나를 쥐어짜지 않는 법', '불안을 건너 고요로...' 등"],
  },
  { label: "모집 마감", lines: ["추후 안내"] },
]

/** 기획서 2번째 걸음의 선택지 — 카드뉴스 3장 '1주 또는 2주 간격 (선택 가능)'. 값은 GAS '형식' 열에 그대로 실린다 */
export const HOST_INTERVALS = ["1주 간격", "2주 간격", "아직 미정"] as const
