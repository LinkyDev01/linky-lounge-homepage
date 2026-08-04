import { WorkroomHome } from "./WorkroomHome"

/**
 * /lazyday/preview/home-v3-workroom — 전면 대개편 v3 홈 시안 (워크룸 이식판)
 * ?nav=ko|en 두 벌, 기본 ko (docs/redesign/03)
 */
export default async function HomeV3WorkroomPage({
  searchParams,
}: {
  searchParams: Promise<{ nav?: string }>
}) {
  const { nav } = await searchParams
  return <WorkroomHome lang={nav === "en" ? "en" : "ko"} />
}
