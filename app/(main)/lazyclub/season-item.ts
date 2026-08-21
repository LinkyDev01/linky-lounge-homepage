/**
 * 레이지데이 북클럽 **현재 기수**의 진열용 표기 (2026-08-21).
 *
 * 기수 자체는 원데이 모임(one-day-config)이 아니라 북클럽 도메인의 상품이라
 * `ONE_DAY_MEETINGS` 에 넣을 수 없다 — 넣으면 모임 목록·캘린더·카트에 전부 새어 나간다.
 * 그렇다고 화면마다 제목·포스터를 다시 적으면 기수 전환 때 갈라지므로, 진열에 필요한
 * 필드만 여기 한 곳에 모아 둔다. 값은 `season-config.ts` 에서 파생 (단일 출처 계승).
 *
 * ⚠ 지시어 없는 모듈 — 서버 컴포넌트(사람 상세)도 읽는다. `base-path.ts` 와 같은 이유.
 * 소비자: `WorkroomHome.ClubAside`(전체보기·모임 우측 진열) · `people/[slug]`(진행하는 모임)
 */

import { SEASON } from "@/app/(main)/lazyday/season-config"
import { BOOKCLUB_URL } from "./base-path"

export const CURRENT_SEASON = {
  id: "bookclub-4",
  /** 기수 일정 (라운드 82, 운영자 제공 — 4기 9/7-11/1).
   *  ⚠ `season-config.periodLabel` 은 "9/9 – 11/1" 로 **값이 다르다**. CLAUDE.md §8 의
   *  4기 기간은 9/7–11/1 이라 화면에 나가던 이 값을 그대로 둔다 — 어느 쪽이 맞는지는
   *  운영자 확인 대상이고, 확인되면 periodLabel 로 파생시켜 하드코딩을 없앨 것 */
  tag: "9/7-11/1",
  status: "open" as const,
  title: `레이지데이 북클럽 ${SEASON.name}`,
  /** 북클럽은 다른 도메인 — 내부 라우트가 없어 항상 새 탭 */
  link: BOOKCLUB_URL,
  thumbnail: "/linky-lounge/book-club/home-v3/hero-4th-poster.webp",
}

/** 기수를 진행하는 사람 (people-config 의 Person.slug).
 *  사람 상세의 '진행하는 모임'이 이 값으로 역참조한다 — one-day-config 의 hostSlug 와 같은 축 */
export const CURRENT_SEASON_HOSTS = ["andongmin"]
