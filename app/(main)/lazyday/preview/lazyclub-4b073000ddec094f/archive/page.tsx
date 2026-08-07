import { ArchiveIndex } from "./ArchiveIndex"

/**
 * 저장소 (라운드 75 신설) — 비제품 창작물 아카이브 피드.
 * 데이터는 archive-config.ts 단일 출처. noindex는 상위 프리뷰 레이아웃이 보장.
 */
export default function ArchivePage() {
  return <ArchiveIndex />
}
