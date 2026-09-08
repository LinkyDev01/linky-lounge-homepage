import type { Metadata } from "next"
import { PosterSpin } from "./PosterSpin"

export const metadata: Metadata = {
  title: "5기 포스터 회전 · 레이지데이 북클럽",
}

export default function Poster5thPage() {
  return <PosterSpin />
}
