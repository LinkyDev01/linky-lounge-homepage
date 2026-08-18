import type { Metadata } from "next"
import { MeetupCalendar } from "./MeetupCalendar"
import { DeferredCss } from "@/components/common/DeferredCss"

/** 일정 (모임 캘린더) — 라운드 93 시안으로 출발해 라운드 121 부터 **내비 '일정'의 목적지**.
 *  셸(내비·푸터)은 MeetupCalendar 안에서 두른다 (제품·아카이브 페이지와 같은 구조).
 *  캘린더 아래에 거북이 트랙이 같은 폭으로 붙는다. */

export const metadata: Metadata = {
  title: "일정 — 레이지클럽",
  robots: { index: false, follow: false },
}

export default function CalendarPage() {
  return (
    <>
      {/* 제목·트랙 문구 배역용 Gothic A1 (800 은 트랙 강조 수치) */}
      <DeferredCss href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@300;600;800&display=swap" />
      <MeetupCalendar />
    </>
  )
}
