// ================================================================
// 장면들(SCENES) 사진 콜라주 — 데이터 단일 출처 (프리뷰 전용)
// 좌열 3장 / 우열 3장. src는 /linky-lounge/book-club/scenes/ 경로로
// 운영자가 채운다. 두 배열이 모두 비어 있으면 ScenesSection이 섹션
// 자체를 렌더하지 않는다 (사진 확보 전 노출 0).
//
// 매트/테이프 회전과 열 엇갈림은 위치 기반이라 컴포넌트에서 index로
// 부여한다. height(px)만 항목별로 여기서 지정한다.
//   좌열 권장 높이: [220, 130, 170]
//   우열 권장 높이: [150, 210, 120]
//
// 예시(운영자 교체 전제):
//   { src: "/linky-lounge/book-club/scenes/table.jpg",
//     alt: "모임 전 테이블에 놓인 책과 다과",
//     caption: "모임 전의 테이블 · 3기", height: 220 }
// ================================================================

export type Scene = {
  src: string
  alt: string
  caption: string
  height: number
}

// 좌열 3장 (권장 높이 220 / 130 / 170)
export const SCENES_LEFT: Scene[] = []

// 우열 3장 (권장 높이 150 / 210 / 120)
export const SCENES_RIGHT: Scene[] = []
