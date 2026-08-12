"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { LazydayLink } from "@/components/common/LazydayLink"
import s from "./draft.module.css"

/**
 * 반응형 초안 셸 — 레이지클럽(워크룸) 셸 문법을 **북클럽 팔레트로 이식**한 사본.
 * 운영자 2026-08-12: "네비/푸터 등은 레이지 클럽 레퍼런스 최대한 살리고".
 *
 * 레이지클럽에서 그대로 가져온 규율 (docs/redesign/08 실측):
 *  - 전폭(컨테이너 max-width 없음) + 좌우 거터 하나로만 폭을 만든다
 *  - **햄버거 금지** — 데스크톱·모바일 동일한 2행 구조, 크기·간격만 축소
 *  - 로고는 grid item 이 아니라 absolute (그리드 아이템+height:100% 는 행 높이를
 *    되먹임해 헤더가 부푸는 버그가 있었다) + `--navLogoSize` 만큼 2행을 들여쓴다
 *  - 푸터 15컬럼 → 720px 이하 4컬럼, 블록은 전부 2/5 로 스택
 *  - 이용약관은 이중 DOM + display 토글 (데스크톱 코너 / 모바일 SNS 윗줄)
 * 북클럽으로 바꾼 것: 색(잉크 #1a1208·종이 #f7f3ee·주황 #d2691e), 서체(SUIT),
 * 내비 항목(랜딩 섹션 앵커 5개 — NavBar.tsx 와 동일 구성·라벨).
 */

const NAV_ITEMS = [
  { id: "book", label: "선정도서" },
  { id: "feature", label: "모임소개" },
  { id: "howto", label: "진행방식" },
  { id: "schedule", label: "일정·장소" },
  { id: "reviews", label: "후기·FAQ" },
]

function useActiveSection() {
  const [activeId, setActiveId] = useState(NAV_ITEMS[0].id)
  useEffect(() => {
    // 실 NavBar 의 offsetTop 방식(컨테이너 기준이라 어긋남) 대신 뷰포트 기준으로.
    // 헤더 실높이를 CSS 변수에서 읽어 브레이크포인트마다 달라지는 값을 그대로 쓴다.
    const onScroll = () => {
      const navH = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--draft-nav-h") || "0",
      ) || 64
      let current = NAV_ITEMS[0].id
      for (const { id } of NAV_ITEMS) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top - navH - 8 <= 0) current = id
      }
      setActiveId(current)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    onScroll()
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])
  return activeId
}

function InstagramIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function KakaoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 300 300" fill="currentColor" aria-hidden>
      <path d="M150,40.992c-56.923,0-103.069,42.684-103.069,95.336,0,38.887,16.287,57.45,38.593,74.373l.107.046v45.636a2.621,2.621,0,0,0,4.184,2.1L128.9,229.452l.841.365A111.675,111.675,0,0,0,150,231.663c56.924,0,103.069-42.684,103.069-95.335S206.924,40.992,150,40.992" />
    </svg>
  )
}

export function DraftShell({ children }: { children: React.ReactNode }) {
  const activeId = useActiveSection()

  return (
    <div className={s.page}>
      <header className={s.header}>
        <LazydayLink href="/" className={s.navLogo} aria-label="레이지데이 북클럽 홈">
          <Image
            src="/assets/logo/logo-mono-ink.svg"
            alt=""
            width={45}
            height={45}
            className={s.navLogoImg}
          />
        </LazydayLink>

        <div className={s.navBrand}>레이지데이 북클럽</div>

        <nav className={s.navAll} aria-label="섹션">
          {NAV_ITEMS.map((it) => (
            <a
              key={it.id}
              href={`#${it.id}`}
              className={`${s.navItem} ${activeId === it.id ? s.navItemOn : ""}`}
            >
              {it.label}
            </a>
          ))}
        </nav>

        <nav className={s.navMenu} aria-label="바로가기">
          <LazydayLink href="/apply" className={s.navApply}>
            신청하기
          </LazydayLink>
        </nav>
      </header>

      {children}

      <footer className={s.footer}>
        <div className={s.footerInner}>
          <figure className={s.footerLogo}>
            <Image src="/assets/logo/logo-mono-ink.svg" alt="레이지데이" width={88} height={88} />
          </figure>

          <div className={s.footerDesc}>
            읽는 사람들의 낮. 레이지데이 북클럽은 서울 사당 링키라운지에서 한 시즌 동안
            네 권의 책을 함께 읽습니다.
          </div>

          <div className={s.footerBiz}>
            주식회사 링키
            <br />
            대표 안동민 · 개인정보관리책임자 안동민
            <br />
            사업자등록번호 557-81-03588
            <br />
            통신판매업신고 2026-별내-0077
            <br />
            경기도 남양주시 별내3로 322, 404호
          </div>

          <div className={s.footerContact}>
            서울 동작구 동작대로7길 44 지하 1층
            <br />
            010-7444-5790
            <br />
            contact@linkylounge.com
            <ul className={s.contractsInline}>
              <li>
                <LazydayLink href="/policy">이용약관</LazydayLink>
              </li>
              <li>
                <LazydayLink href="/privacy">개인정보처리방침</LazydayLink>
              </li>
            </ul>
            <div className={s.footerSns}>
              <a href="https://instagram.com/lazyday_bookclub" target="_blank" rel="noopener noreferrer" aria-label="인스타그램">
                <InstagramIcon />
              </a>
              <a href="https://pf.kakao.com/_gixaAX" target="_blank" rel="noopener noreferrer" aria-label="카카오톡 채널">
                <KakaoIcon />
              </a>
            </div>
          </div>

          <ul className={s.contracts}>
            <li>
              <LazydayLink href="/policy">이용약관</LazydayLink>
            </li>
            <li>
              <LazydayLink href="/privacy">개인정보처리방침</LazydayLink>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  )
}
