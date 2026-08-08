"use client"

/**
 * 모임 캘린더 — 레이지클럽 톤 시안 (라운드 93, 운영자)
 *
 * 원본 `components/lounge/MeetupCalendarSection.tsx`(linkylounge, Tailwind)를
 * 레이지클럽 문법으로 다시 짠 것. **원본 파일은 건드리지 않는다** — 시안 승인 후
 * 이식 여부를 따로 판단한다.
 *
 * 데이터 계약은 그대로 계승:
 *   useGoogleCalendarMeetups(year, month) → { meetups, isLoading, error, refetch }
 *   날짜 매핑 키는 meetup.day 숫자 하나
 * 시안에서는 폴백 상수(MEETUPS)가 2026-01 자료뿐이라 늘 빈 달로 보이므로
 * 보고 있는 달에 맞춘 표본(calendar-preview-data)을 깐다. 이식 시 표본만 제거.
 *
 * 원본 대비 의도적으로 뺀 것 (레이지클럽 규율):
 *   · 그림자·rounded-2xl 카드·hover 리프트 → 1px 괘선 조판으로 대체
 *   · 모바일 3D 캐러셀(blur·rotateY) → 세로 목록 하나로 통일
 *   · 민트 CTA 버튼 → 주황 텍스트 링크
 * 원본 대비 고친 것: 날짜 셀을 <button> 으로 (원본은 div onClick — 키보드 접근 불가),
 *   월 이동 버튼 aria-label, 로딩 role="status", aria-pressed/aria-current 부여.
 * 분석 이벤트(calendar_month_change / calendar_date_click / meetup_apply_click)는
 * 시안이라 호출하지 않는다 — 실이식 시 원본과 동일한 이름·파라미터로 되살릴 것.
 */

import { useEffect, useState } from "react"
import { useGoogleCalendarMeetups } from "@/hooks/use-google-calendar-meetups"
import type { Meetup } from "@/types"
import { TurtleTrack } from "../turtle/TurtleTrack"
import { CATEGORY_TONE, previewMeetupsFor } from "./calendar-preview-data"
import styles from "./calendar.module.css"

const DOW = ["일", "월", "화", "수", "목", "금", "토"]

export function MeetupCalendar() {
  // 첫 페인트에 실제 날짜를 쓰면 서버·클라이언트가 어긋난다 → 마운트 후 확정
  const [cursor, setCursor] = useState<{ y: number; m: number } | null>(null)
  const [today, setToday] = useState<{ y: number; m: number; d: number } | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  useEffect(() => {
    const now = new Date()
    setCursor({ y: now.getFullYear(), m: now.getMonth() })
    setToday({ y: now.getFullYear(), m: now.getMonth(), d: now.getDate() })
  }, [])

  const y = cursor?.y ?? 2026
  const m = cursor?.m ?? 0
  const { meetups: fetched, isLoading } = useGoogleCalendarMeetups(y, m, { enabled: cursor !== null })

  // 시안 표본 — 훅이 비어 있을 때만 (실데이터가 들어오면 그대로 밀려난다)
  const meetups: Meetup[] = cursor === null ? [] : fetched.length > 0 ? fetched : previewMeetupsFor(y, m)

  const firstDay = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const forDay = (day: number) => meetups.filter((x) => x.day === day)
  const shown = selectedDay === null ? meetups : forDay(selectedDay)

  const move = (step: number) => {
    setSelectedDay(null)
    setCursor((c) => {
      if (!c) return c
      const d = new Date(c.y, c.m + step, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.label}>모임 일정</span>
        <div className={styles.monthNav}>
          <button type="button" className={styles.navBtn} aria-label="이전 달" onClick={() => move(-1)}>
            ‹
          </button>
          <span className={styles.month}>{cursor ? `${y}년 ${m + 1}월` : " "}</span>
          <button type="button" className={styles.navBtn} aria-label="다음 달" onClick={() => move(1)}>
            ›
          </button>
        </div>
      </div>

      <div className={styles.grid} role="grid" aria-label={`${y}년 ${m + 1}월 모임 일정`}>
        {DOW.map((d) => (
          <div key={d} className={styles.dow} role="columnheader">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`b${i}`} className={styles.blank} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const list = forDay(day)
          const isToday = today !== null && today.y === y && today.m === m && today.d === day
          const isSel = selectedDay === day
          const cls = [
            styles.cell,
            list.length > 0 ? styles.hasMeetup : "",
            list.length > 0 ? styles.clickable : "",
            isToday ? styles.today : "",
            isSel ? styles.selected : "",
          ]
            .filter(Boolean)
            .join(" ")
          return (
            <button
              key={day}
              type="button"
              className={cls}
              disabled={list.length === 0}
              aria-pressed={isSel}
              aria-current={isToday ? "date" : undefined}
              aria-label={`${m + 1}월 ${day}일${list.length ? `, 모임 ${list.length}개` : ""}`}
              onClick={() => setSelectedDay(isSel ? null : day)}
            >
              <span className={styles.dayNum}>{day}</span>
              {list.length > 0 && (
                <>
                  {/* 넓은 화면 — 제목까지 읽히는 텍스트 줄 (라운드 94).
                      좁은 화면에서는 CSS 로 감추고 아래 점 표기로 되돌아간다 */}
                  <span className={styles.chips}>
                    {list.slice(0, 2).map((x) => (
                      <span key={x.id} className={styles.chip}>
                        <span className={styles.dot} style={{ background: CATEGORY_TONE[x.category].color }} />
                        <span className={styles.chipText}>{x.title}</span>
                      </span>
                    ))}
                    {list.length > 2 && <span className={styles.more}>+{list.length - 2}</span>}
                  </span>
                  <span className={styles.dots}>
                    {list.map((x) => (
                      <span
                        key={x.id}
                        className={styles.dot}
                        style={{ background: CATEGORY_TONE[x.category].color }}
                      />
                    ))}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>

      <div className={styles.legend}>
        {(Object.keys(CATEGORY_TONE) as Array<keyof typeof CATEGORY_TONE>).map((k) => (
          <span key={k} className={styles.legendItem}>
            <span className={styles.dot} style={{ background: CATEGORY_TONE[k].color }} />
            {CATEGORY_TONE[k].label}
          </span>
        ))}
      </div>

      {/* 거북이 트랙 — 폭은 .wrap 을 그대로 따른다 (운영자: 트랙 너비는 캘린더에 맞춤) */}
      <div className={styles.trackSlot}>
        <TurtleTrack />
      </div>

      <div className={styles.listHead}>
        <span className={styles.listTitle}>
          {selectedDay === null ? "이번 달 모임" : `${m + 1}월 ${selectedDay}일 모임`}{" "}
          <span className={styles.listCount}>{shown.length}</span>
        </span>
        {selectedDay !== null && (
          <button type="button" className={styles.clearBtn} onClick={() => setSelectedDay(null)}>
            전체 보기
          </button>
        )}
      </div>

      {isLoading ? (
        <p className={styles.empty} role="status">
          모임 정보를 불러오는 중…
        </p>
      ) : shown.length === 0 ? (
        <p className={styles.empty}>
          이번 달은 예정된 모임이 없습니다.
          <br />
          다른 달을 확인해 보세요.
        </p>
      ) : (
        <ul className={styles.list}>
          {shown.map((x) => (
            <MeetupRow key={x.id} meetup={x} month={m + 1} />
          ))}
        </ul>
      )}
    </div>
  )
}

function MeetupRow({ meetup: x, month }: { meetup: Meetup; month: number }) {
  const tone = CATEGORY_TONE[x.category]
  const bySex = x.maleCapacity !== undefined && x.femaleCapacity !== undefined
  const left = x.capacity - x.current
  return (
    <li className={styles.item}>
      <figure className={styles.thumb}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={x.image || "/placeholder.svg"} alt="" draggable={false} />
      </figure>
      <div className={styles.body}>
        <span className={styles.cat}>
          <span className={styles.dot} style={{ background: tone.color }} />
          {tone.label}
        </span>
        <span className={styles.itemTitle}>{x.title}</span>
        <span className={styles.meta}>
          {month}월 {x.day}일 · {x.time}
        </span>
        {x.description && <span className={styles.desc}>{x.description}</span>}
        <span className={styles.foot}>
          <span className={styles.price}>{x.price}</span>
          <span className={styles.seats}>
            {bySex ? (
              `남 ${Math.max(0, (x.maleCapacity ?? 0) - (x.maleCurrent ?? 0))}석 · 여 ${Math.max(
                0,
                (x.femaleCapacity ?? 0) - (x.femaleCurrent ?? 0),
              )}석`
            ) : left <= 0 ? (
              <span className={styles.soldout}>마감</span>
            ) : (
              `잔여 ${left}석`
            )}
          </span>
          {x.registrationUrl ? (
            <a className={styles.apply} href={x.registrationUrl} target="_blank" rel="noopener noreferrer">
              신청하기 ↗
            </a>
          ) : (
            <span className={styles.applyOff}>준비 중</span>
          )}
        </span>
      </div>
    </li>
  )
}
