/**
 * 호스트 모집 — 진열·상세가 함께 읽는 값 (2026-09-10, 운영자 제공 카드뉴스 5장 기준).
 *   1장 = 포스터(WE ARE HIRING — NEW LEADERS, 1080×1350 → 720 축소 webp)
 *   2~5장 = 소개 · 모임 운영 안내 · 지원 시 필요 사항 · 지원 방법 — **이미지 그대로 싣는다**
 *           (운영자 2026-09-10 "최대한 이미지 베이스로만 하고, 그 외 내용은 배제" — 1080×1350 → 920 축소 webp,
 *            본문 컬럼 460 의 ×2). 옮겨 적은 텍스트·초안 단락은 두지 않는다.
 * 소비자: /hosts 상세(hosts/page.tsx) · /people 우측 카드(people/HostsAside.tsx)
 * ⚠ 표기는 '레이지클럽'(붙여 쓴다, 운영자 2026-09-10). 지시어 없는 모듈 — 서버·클라이언트 공용.
 */

export const HOSTS_POSTER = "/linky-lounge/book-club/home-v3/hosts-poster.webp"

/** 사람 페이지 우측 카드 문구 — 운영자 원문(2026-09-10 "위에 작은 글씨 '레이지클럽', 메인 제목 '호스트 모집 중'") */
export const HOSTS_CARD = { cat: "레이지클럽", name: "호스트 모집 중" } as const

/** 카드뉴스 2~5장 — alt 는 각 장의 머리글(원문) */
export const HOSTS_CARDS: { src: string; alt: string }[] = [
  { src: "/linky-lounge/book-club/home-v3/hosts-card-2.webp", alt: "레이지 클럽 호스트를 모집합니다." },
  { src: "/linky-lounge/book-club/home-v3/hosts-card-3.webp", alt: "모임 운영 안내" },
  { src: "/linky-lounge/book-club/home-v3/hosts-card-4.webp", alt: "호스트 지원 시 필요 사항" },
  {
    src: "/linky-lounge/book-club/home-v3/hosts-card-5.webp",
    alt: "지원을 원하시는 분은 이메일(contact@lazy-club.com) 또는 인스타그램 DM을 통해 위 내용을 남겨주세요.",
  },
]

/** 기획서 2번째 걸음의 선택지 — 카드뉴스 3장 '1주 또는 2주 간격 (선택 가능)'. 값은 GAS '형식' 열에 그대로 실린다 */
export const HOST_INTERVALS = ["1주 간격", "2주 간격", "아직 미정"] as const
