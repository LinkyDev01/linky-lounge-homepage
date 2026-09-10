/**
 * 호스트 모집 — 진열·상세가 함께 읽는 값 (2026-09-10, 운영자 제공 카드뉴스 5장 기준).
 *   1장 = 포스터(WE ARE HIRING — NEW LEADERS, 1080×1350 → 720 축소 webp)
 *   2~5장 = 소개 · 모임 운영 안내 · 지원 시 필요 사항 · 지원 방법
 *   실 /hosts 는 카드 원문을 **텍스트로 그대로** 옮긴 판(운영자 2026-09-10 "저걸 텍스트로 적어달라는 의미. 톤앤매너
 *   맞추어서" — 문장은 원문, 서식만 사이트 것). 이미지판은 /hosts/cards(링크 없음·noindex)에만.
 *   페이지가 지어낸 문장은 두지 않는다 — 원문에 없는 항목(모집 마감 등)도 만들지 않는다.
 * 소비자: /hosts 상세(hosts/page.tsx) · /hosts/cards 이미지판 · /people 우측 카드(people/HostsAside.tsx)
 * ⚠ 표기는 '레이지클럽'(붙여 쓴다, 운영자 2026-09-10). 지시어 없는 모듈 — 서버·클라이언트 공용.
 */

export const HOSTS_POSTER = "/linky-lounge/book-club/home-v3/hosts-poster.webp"
/** 사람 페이지 카드 전용 포스터 — 운영자 제공 'hiring.png'(2026-09-10, 어두운 바탕) 1080×1350 → 720 webp.
 *  ⚠ /hosts 상세는 그대로 밝은 포스터(HOSTS_POSTER) — 운영자 "클릭했을 때 이미지는 지금 색깔의 포스터 유지" */
export const HOSTS_CARD_POSTER = "/linky-lounge/book-club/home-v3/hosts-poster-dark.webp"

/** 사람 페이지 우측 카드 문구 — 운영자 원문(2026-09-10 "위에 작은 글씨 '레이지클럽', 메인 제목 '호스트 모집 중'") */
export const HOSTS_CARD = { cat: "레이지클럽", name: "호스트 모집 중" } as const

/** 우측 요약 — 카드뉴스 3장 '모임 운영 안내' 원문 그대로(항목 추가 없음) */
export const HOSTS_FIELDS: { label: string; lines: string[] }[] = [
  { label: "진행 횟수", lines: ["총 4회차"] },
  { label: "진행 시간", lines: ["각 회차 2시간"] },
  { label: "시작 일정", lines: ["11월 이후"] }, // 운영자 2026-09-10 정정 (카드뉴스 "10월 ~ 11월 중" → "11월 이후")
  { label: "진행 간격", lines: ["1주 또는 2주 간격 (선택 가능)"] },
  { label: "진행 장소", lines: ["사당, 을지로, 시청, 강남, 성수, 홍대 중 선택 가능"] },
  {
    label: "모임 주제",
    lines: ["자유 (단, 4회차 모임 간의 유기적인 연관성 필수)", "ex. '비로소, 나를 쥐어짜지 않는 법', '불안을 건너 고요로...' 등"],
  },
]

/** 카드뉴스 2~5장 이미지(/hosts/cards 전용) — alt 는 각 장의 머리글(원문) */
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
