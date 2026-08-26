import type { Metadata } from "next"
import { ShopColorIdeas } from "./ShopColorIdeas"

/** 제품 컬러 표기 발산 시안 (라운드 131) — 이미지 바로 밑 확정 전제에서
 *  표현 방식 6안을 한 화면에 나열. 내비 미등록, 실목록 미반영. */

export const metadata: Metadata = {
  title: "제품 컬러 시안 — 레이지클럽",
  robots: { index: false, follow: false },
}

export default function ShopColorsPage() {
  return <ShopColorIdeas />
}
