// ================================================================
// 장면들(SCENES) — 데이터 단일 출처 (프리뷰 전용, 운영자 확정 2026-07-07)
//
// 장면 = 앨범: photos[0]이 표지(벽에는 표지만 보임), 리프트 뷰어에서
// 가로 슬라이드로 나머지 사진을 넘겨 본다.
//  · photos가 빈 장면은 미렌더, 전부 비면 섹션 자체 미렌더
//  · label(손글씨 캡션)·quote(명조 발췌)·사진 캡션 원문은 전부
//    TODO — 운영자 원고·촬영본 대기 (아래는 자리표시)
//  · 장면 ⑥ '모임이 남긴 것들' = 손글씨 후기 스캔 통합
//    (후기 섹션 별도 신설은 영구 보류 — DECISIONS 2026-07-07)
// ================================================================

export type ScenePhoto = {
  src: string
  alt: string
  /** 비표지 사진의 캡션 (리프트 중 페이지별 표시) — TODO 운영자 원고 */
  caption: string
}

export type Scene = {
  id: string
  /** 벽 캡션 — 손글씨 (Nanum Pen) — TODO 운영자 원고 */
  label: string
  /** 표지 이미지 박스 높이(px) — 390 문법 기준 */
  height: number
  /** 매트 회전(도) */
  rotate: number
  /** 워시테이프 회전(도) */
  tapeRotate: number
  /** [0] = 표지. 벽에는 표지만 걸린다 */
  photos: ScenePhoto[]
  /** 명조 발췌 (겹따옴표 포함 표기) — TODO 운영자 원고 */
  quote?: string
}

// ⚠ 이미지 전부 레이아웃 확인용 임시(레포 기존 이미지) — 촬영본 오면 교체
const TODO = "[자리표시 — 운영자 원고 대기]"

export const SCENES: Scene[] = [
  {
    id: "table",
    label: "19:20, 시작 전 테이블",
    height: 220,
    rotate: -0.8,
    tapeRotate: 0,
    photos: [
      { src: "/linky-lounge/book-club/book-club.webp", alt: "[임시] 시작 전 테이블", caption: TODO },
      { src: "/linky-lounge/book-club/book-club-hero.webp", alt: "[임시] 테이블 다른 각도", caption: TODO },
    ],
  },
  {
    id: "arrival",
    label: "도착, 다과 한 접시",
    height: 150,
    rotate: 0.9,
    tapeRotate: -1,
    photos: [
      { src: "/linky-lounge/book-club/books/2기-3-사랑의 기술.jpg", alt: "[임시] 다과", caption: TODO },
    ],
  },
  {
    id: "note",
    label: "펼쳐진 레이지노트",
    height: 170,
    rotate: -0.4,
    tapeRotate: -2,
    quote: "“[발제 발췌 자리 — 운영자 원고 대기]”",
    photos: [
      { src: "/linky-lounge/book-club/books/1기-1-어린 왕자.jpg", alt: "[임시] 레이지노트", caption: TODO },
      { src: "/linky-lounge/book-club/books/1기-3-엥케이리디온.jpg", alt: "[임시] 노트 두 번째", caption: TODO },
      { src: "/linky-lounge/book-club/books/1기-4-시지프 신화.jpg", alt: "[임시] 노트 세 번째", caption: TODO },
    ],
  },
  {
    id: "underline",
    label: "1부, 밑줄 친 문장들",
    height: 210,
    rotate: -0.6,
    tapeRotate: 2,
    quote: "“[발제 발췌 자리 — 운영자 원고 대기]”",
    photos: [
      { src: "/linky-lounge/book-club/books/1기-4-시지프 신화.jpg", alt: "[임시] 밑줄 친 책", caption: TODO },
      { src: "/linky-lounge/book-club/books/2기-1-가장 젊은 날의 철학.jpg", alt: "[임시] 다른 밑줄", caption: TODO },
    ],
  },
  {
    id: "traces",
    label: "2부의 흔적",
    height: 130,
    rotate: 0.5,
    tapeRotate: 1.5,
    photos: [
      { src: "/linky-lounge/book-club/books/2기-2-브람스를 좋아하세요.jpg", alt: "[임시] 2부의 흔적", caption: TODO },
    ],
  },
  {
    id: "afterwords",
    label: "모임이 남긴 것들",
    height: 120,
    rotate: 0.4,
    tapeRotate: 0,
    // 후기 한 줄 발췌 — TODO 실제 후기 원문으로 교체
    quote: "“[후기 한 줄 발췌 자리 — 운영자 원고 대기]”",
    // 손글씨 후기 스캔 사진들 — TODO 스캔본으로 교체
    photos: [
      { src: "/linky-lounge/book-club/lazyday_poster_v2.webp", alt: "[임시] 손글씨 후기 스캔 1", caption: TODO },
      { src: "/linky-lounge/book-club/lazy_typo_brown.png", alt: "[임시] 손글씨 후기 스캔 2", caption: TODO },
    ],
  },
]
