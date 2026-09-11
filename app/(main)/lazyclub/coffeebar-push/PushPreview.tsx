"use client"

/**
 * [프리뷰] /meetings/dm-gd 페이지 사본 + TitlePush 안무. 상단 고정 조작칸: 다시 재생 · 3배속.
 * 페이지 마크업은 meetings/dm-gd/page.tsx 의 사본이다(프리뷰 전용 분리 사본 — 실사이트를 고칠 때 이 사본을
 * 따라 고칠 의무는 없다; 승인 후 TitlePush 만 실사이트로 이식한다).
 */

import { useState } from "react"
import { WorkroomShell } from "../Shell"
import { CoffeeBarForm } from "../meetings/dm-gd/CoffeeBarForm"
import { LogoDrop } from "../meetings/dm-gd/LogoDrop"
import { NavOffset } from "../meetings/dm-gd/NavOffset"
import { TitlePush } from "../meetings/dm-gd/TitlePush"
import styles from "../home.module.css"
import cb from "../meetings/dm-gd/coffeebar.module.css"

const LOGO = "/linky-lounge/book-club/home-v3/nav-logo-circle.png"

function BrandRun() {
  return (
    <>
      <span className={cb.kOrange}>동민과 고든</span> <span className={cb.kPlum}>커피</span>
      <span className={cb.kSage}>앤</span>
      <span className={cb.kPlum}>바</span>
    </>
  )
}

export function PushPreview() {
  const [run, setRun] = useState(0)
  const [fast, setFast] = useState(false)
  return (
    <WorkroomShell>
      <div
        style={{
          position: "fixed",
          left: 15,
          bottom: 14,
          zIndex: 600,
          display: "flex",
          gap: 14,
          fontFamily: "var(--suit)",
          fontSize: 12,
          background: "var(--paper)",
          padding: "4px 0",
        }}
      >
        <button type="button" onClick={() => setRun((n) => n + 1)} style={{ background: "none", border: 0, padding: 0, font: "inherit", textDecoration: "underline", cursor: "pointer" }}>
          다시 재생
        </button>
        <button type="button" onClick={() => { setFast((f) => !f); setRun((n) => n + 1) }} style={{ background: "none", border: 0, padding: 0, font: "inherit", textDecoration: "underline", cursor: "pointer" }}>
          {fast ? "1배속으로" : "3배속으로"}
        </button>
      </div>
      <main className={styles.content}>
        <div className={cb.root} data-cb-root>
          <NavOffset />
          <LogoDrop key={`drop-${run}`} />
          <TitlePush key={`push-${run}`} speed={fast ? 3 : 1} />
          <div className={cb.ticker}>
            <div className={cb.tickerTrack}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span className={cb.tickerItem} key={i} aria-hidden={i > 0 || undefined}>
                  <BrandRun />를 발견하신 여러분을 환영합니다.
                </span>
              ))}
            </div>
          </div>

          <div className={cb.page}>
            <header className={cb.head}>
              <h1 className={cb.title}>
                <span className={cb.titleTop} data-cb-title-top>
                  동민과 고든
                </span>
                <span>
                  <span className={cb.kPlum}>커피</span>
                  <span className={cb.kSage}>앤</span>
                  <span className={cb.kPlum}>바</span>
                </span>
              </h1>
              <span className={cb.logoSway} data-cb-sway>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={cb.logo} data-cb-logo src={LOGO} alt="레이지 클럽" width={74} height={74} />
              </span>
            </header>

            <div className={cb.intro}>
              <p>
                안녕하세요. <span className={cb.kOrange}>동민과 고든</span>입니다.
              </p>
              <p>
                <BrandRun />는 음료 및 주류 판매점이 아닙니다.
              </p>
              <p className={cb.oneLine}>
                레이지 클럽 운영자인 안동민, 천고든과 대화를 나누고 싶은 분들을 위한 자리입니다.
              </p>
              <p>가벼운 수다부터 사업 논의, 아이디어 구상까지 어떠한 대화든 환영합니다.</p>
              <p>신청서를 작성해 주시면 해당 번호로 연락드리겠습니다.</p>
              <p>감사합니다.</p>
            </div>

            <p className={cb.fee}>참가비: 2만원/시간</p>

            <section className={cb.menu}>
              <h2 className={cb.blockHead}>
                [환영 음료]
                <span className={cb.blockNote}>(참가비에 포함)</span>
              </h2>
              <div className={cb.group}>
                <p className={cb.groupLabel}>논알콜.</p>
                <p className={cb.item}>콜드브루</p>
                <p className={cb.item}>핸드드립</p>
                <p className={cb.item}>생수</p>
              </div>
              <div className={cb.group}>
                <p className={cb.groupLabel}>알콜.</p>
                <p className={cb.item}>
                  <span className={cb.noHave}>네그로니</span>는 없습니다.
                </p>
                <p className={cb.item}>
                  <span className={cb.noHave}>네비올로</span>도 없습니다.
                </p>
              </div>
            </section>

            <h2 className={`${cb.blockHead} ${cb.formHead}`}>[신청서]</h2>
            <CoffeeBarForm />
          </div>
        </div>
      </main>
    </WorkroomShell>
  )
}
