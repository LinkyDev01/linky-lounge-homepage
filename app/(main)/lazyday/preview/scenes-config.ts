// ================================================================
// 장면들(SCENES) 사진 콜라주 — 데이터 단일 출처 (프리뷰 전용)
//
// 큐레이션 원칙 (운영자 확정 2026-07-07):
//  · 정물 6컷, 사람 없음 — 단 '사람의 흔적'이 담긴 정물 ≥3컷
//    (마시다 만 찻잔, 서로 다른 필체의 레이지노트, 색색의 밑줄, 걸쳐진 가디건)
//  · 하루 타임라인 순서: 모임 전 테이블 → 도착·다과 → 레이지노트 →
//    밑줄 친 책(1부) → 2부의 흔적 → 마지막 페이지
//  · 캡션 2층: label(장면 라벨) + quote(발제 발췌, 명조) — quote는 2~3컷에만
//  · 발제 발췌·라벨 문구는 운영자 소유 원고 — 아래는 전부 자리표시(placeholder)
//  · 링크·버튼 없음 — 클로징 CTA가 바로 뒤라 배치 자체가 핸드오프
//
// ⚠ 현재 이미지 6장은 레이아웃 확인용 임시 자리표시(레포 기존 이미지 재사용).
//   실제 촬영본이 오면 src·alt만 교체. 실사이트 이식은 사진+원고 확정 후.
// ================================================================

export type Scene = {
  src: string
  alt: string
  /** 장면 라벨 (10.5px, 상시) */
  caption: string
  /** 발제 발췌 (명조, 선택 — 2~3컷에만) */
  quote?: string
  height: number
}

// 좌열 3장 — 타임라인 홀수 번째 (① 모임 전 → ③ 레이지노트 → ⑤ 2부의 흔적)
export const SCENES_LEFT: Scene[] = [
  {
    src: "/linky-lounge/book-club/book-club.webp",
    alt: "[임시] 모임 전 테이블",
    caption: "[자리표시] 19:20, 시작 전 테이블",
    height: 220,
  },
  {
    src: "/linky-lounge/book-club/books/1기-1-어린 왕자.jpg",
    alt: "[임시] 펼쳐진 레이지노트",
    caption: "[자리표시] 오늘의 레이지노트",
    quote: "[발제 발췌 자리 — 운영자 원고 대기]",
    height: 130,
  },
  {
    src: "/linky-lounge/book-club/book-club-hero.webp",
    alt: "[임시] 2부의 흔적",
    caption: "[자리표시] 두 번째 화두가 지나갈 무렵",
    height: 170,
  },
]

// 우열 3장 — 타임라인 짝수 번째 (② 도착·다과 → ④ 밑줄 친 책 → ⑥ 마지막 페이지)
export const SCENES_RIGHT: Scene[] = [
  {
    src: "/linky-lounge/book-club/books/2기-3-사랑의 기술.jpg",
    alt: "[임시] 도착과 다과",
    caption: "[자리표시] 도착, 따뜻한 다과",
    height: 150,
  },
  {
    src: "/linky-lounge/book-club/books/1기-4-시지프 신화.jpg",
    alt: "[임시] 밑줄 친 책",
    caption: "[자리표시] 같은 문장, 다른 밑줄",
    quote: "[발제 발췌 자리 — 운영자 원고 대기]",
    height: 210,
  },
  {
    src: "/linky-lounge/book-club/lazyday_poster_v2.webp",
    alt: "[임시] 마지막 페이지",
    caption: "[자리표시·클로징 다리 문구 대기] 22:30, 모임이 끝난 자리",
    height: 120,
  },
]
