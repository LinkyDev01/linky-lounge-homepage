/**
 * 저장소(아카이브) 단일 출처 — 비제품 창작물 피드 (라운드 75 신설).
 * 상품이 아니므로 가격·상태·카트가 없다. 이미지 + 캡션만.
 * 항목을 추가하면 /archive 피드에 그대로 나열된다 (최신이 위).
 */
export type ArchiveItem = {
  id: string
  /** 화면에 노출되는 한 줄 캡션 */
  caption: string
  /** public/ 기준 경로 */
  image: string
  /** 노출용 날짜 표기 (예: 2026.08) — 비워도 된다 */
  date?: string
}

export const ARCHIVE_ITEMS: ArchiveItem[] = []
