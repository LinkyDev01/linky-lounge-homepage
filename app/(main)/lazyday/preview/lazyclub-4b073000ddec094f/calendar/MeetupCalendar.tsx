"use client"

/**
 * 모임 캘린더 — 레이지클럽 톤 시안 (라운드 93 신설 · 94 셀 텍스트 · 95 실일정 투입)
 *
 * 원본 `components/lounge/MeetupCalendarSection.tsx`(linkylounge, Tailwind)를
 * 레이지클럽 문법으로 다시 짠 것. **원본 파일은 건드리지 않는다** — 시안 승인 후
 * 이식 여부를 따로 판단한다.
 *
 * 일정 출처는 `calendar-events.ts` → season-config(4기) · one-day-config(원데이 토크)
 * 단일 출처에서 파생. 기수가 바뀌면 season-config 만 고치면 캘린더도 따라온다.
 * (원본의 `useGoogleCalendarMeetups` 경로는 쓰지 않는다 — 위 config 가 이미 확정
 *  일정을 갖고 있어서. 실이식 때 소스 선택은 운영자 결정 사항)
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
import { LazydayLink } from "@/components/common/LazydayLink"
import { TurtleTrack } from "../turtle/TurtleTrack"
import { CATEGORY_TONE, eventsFor, programsFor, type ClubProgram, type EventCategory } from "./calendar-events"
import styles from "./calendar.module.css"

const DOW = ["일", "월", "화", "수", "목", "금", "토"]

/** 날짜 칸에 보여 줄 일정 최대 개수 — 운영자 라운드 101: "하루에 세 모임까지는 표시되어야".
 *  실데이터 최대치가 하루 3건(8/2: 3기 2회차 + 브람스 + 무비토크)이라 3이면 "+N" 이 사라진다 */
const MAX_CHIPS = 3

/** 시즌이 9~11월이라 8월에 열면 원데이 토크만 보인다 — 첫 화면은 일정이 있는 달로 */
const FIRST_MONTH = { y: 2026, m: 8 } // 2026년 9월 (0-based)

export function MeetupCalendar() {
  // 첫 페인트에 실제 날짜를 쓰면 서버·클라이언트가 어긋난다 → 마운트 후 확정
  const [cursor, setCursor] = useState<{ y: number; m: number } | null>(null)
  const [today, setToday] = useState<{ y: number; m: number; d: number } | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  useEffect(() => {
    const now = new Date()
    setToday({ y: now.getFullYear(), m: now.getMonth(), d: now.getDate() })
    // 이번 달에 일정이 있으면 이번 달, 없으면 시즌 첫 달
    const has = eventsFor(now.getFullYear(), now.getMonth()).length > 0
    setCursor(has ? { y: now.getFullYear(), m: now.getMonth() } : FIRST_MONTH)
  }, [])

  const y = cursor?.y ?? FIRST_MONTH.y
  const m = cursor?.m ?? FIRST_MONTH.m
  const events = cursor === null ? [] : eventsFor(y, m)

  const firstDay = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const forDay = (day: number) => events.filter((x) => x.day === day)
  // 목록은 **모임 단위** — 같은 기수가 여러 날 걸려도 카드는 하나 (라운드 99)
  const shown = cursor === null ? [] : programsFor(y, m, selectedDay)

  // 범례는 이번 달에 실제로 있는 종류만
  const usedCats = (Object.keys(CATEGORY_TONE) as EventCategory[]).filter((k) =>
    events.some((e) => e.category === k),
  )

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
          <span className={styles.month}>{cursor ? `${y}년 ${m + 1}월` : " "}</span>
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
                  {/* 텍스트 줄 (라운드 94 · 96): 카테고리 색은 CSS 변수로 넘긴다 —
                      넓은 화면은 점+제목, 좁은 화면은 구글 캘린더식 **알약 라벨**
                      (색면 + 종이색 글자 + 말줄임)로 같은 마크업이 변신한다 */}
                  <span className={styles.chips}>
                    {list.slice(0, MAX_CHIPS).map((x) => (
                      <span
                        key={x.id}
                        className={styles.chip}
                        style={{ "--cat": CATEGORY_TONE[x.category].color } as React.CSSProperties}
                      >
                        <span className={styles.dot} />
                        {x.cellLines ? (
                          // 정규 기수 — 브랜드 줄 / 기수-회차 줄 고정 2줄 (라운드 104)
                          <span className={styles.chipLines}>
                            <span className={styles.chipBrand}>{x.cellLines[0]}</span>
                            <span className={styles.chipRound}>{x.cellLines[1]}</span>
                          </span>
                        ) : (
                          <span className={styles.chipText}>{x.cellLabel}</span>
                        )}
                      </span>
                    ))}
                    {list.length > MAX_CHIPS && <span className={styles.more}>+{list.length - MAX_CHIPS}</span>}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>

      {usedCats.length > 0 && (
        <div className={styles.legend}>
          {usedCats.map((k) => (
            <span key={k} className={styles.legendItem}>
              <span className={styles.dot} style={{ background: CATEGORY_TONE[k].color }} />
              {CATEGORY_TONE[k].label}
            </span>
          ))}
        </div>
      )}

      <div className={styles.listHead}>
        <span className={styles.listTitle}>
          {selectedDay === null ? `${m + 1}월 모임` : `${m + 1}월 ${selectedDay}일 모임`}{" "}
          <span className={styles.listCount}>{shown.length}</span>
        </span>
        {selectedDay !== null && (
          <button type="button" className={styles.clearBtn} onClick={() => setSelectedDay(null)}>
            전체 보기
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p className={styles.empty}>
          이 달은 예정된 모임이 없습니다.
          <br />
          다른 달을 확인해 보세요.
        </p>
      ) : (
        <ul className={styles.list}>
          {shown.map((p) => (
            <ProgramRow key={p.id} p={p} />
          ))}
        </ul>
      )}

      {/* 거북이 트랙 — 맨 아래 섹션 (라운드 96, 운영자).
          폭은 .wrap 을 그대로 따른다 (트랙 너비 = 캘린더 너비) */}
      <div className={styles.trackSlot}>
        <TurtleTrack />
      </div>
    </div>
  )
}

function ProgramRow({ p }: { p: ClubProgram }) {
  const tone = CATEGORY_TONE[p.category]
  return (
    <li className={styles.item}>
      {/* 포스터가 없어도 칸은 비워 둔다 (운영자 라운드 102) — 카드끼리 본문 시작선이 맞는다 */}
      <figure className={`${styles.thumb} ${p.image ? "" : styles.thumbEmpty}`}>
        {p.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt="" draggable={false} />
        )}
      </figure>
      <div className={styles.body}>
        <span className={styles.cat}>
          <span className={styles.dot} style={{ background: tone.color }} />
          {tone.label}
          {p.note && (
            <span
              className={`${styles.note} ${
                p.note === "모집 중" ? styles.noteOpen : p.note === "마감" || p.note === "종료" ? styles.noteClosed : ""
              }`}
            >
              {p.note}
            </span>
          )}
        </span>
        <span className={styles.itemTitle}>{p.title}</span>
        <span className={styles.meta}>{p.schedule}</span>
        {p.times.length > 0 && (
          <span className={styles.times}>
            {p.times.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </span>
        )}
        {p.description && <span className={styles.desc}>{p.description}</span>}
        <span className={styles.foot}>
          {p.price ? <span className={styles.price}>{p.price}</span> : <span />}
          {p.external ? (
            <a className={styles.apply} href={p.href} target="_blank" rel="noopener noreferrer">
              {p.cta} ↗
            </a>
          ) : (
            <LazydayLink href={p.href} className={styles.apply}>
              {p.cta}
            </LazydayLink>
          )}
        </span>
      </div>
    </li>
  )
}
