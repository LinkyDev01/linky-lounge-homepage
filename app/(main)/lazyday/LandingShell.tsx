"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { LazydayLink } from "@/components/common/LazydayLink"
import { LazydayMark } from "./LazydayMark"
import { CHROME_NOSCRIPT_CSS, useChromeIntro } from "./useChromeIntro"
import s from "./landing-shell.module.css"

/**
 * 랜딩 셸 — 반응형 초안(preview/bookclub-responsive)의 승인본 이식 (2026-08-12).
 * 원본 LandingShell 과 **값 동일**; 프리뷰 전용 요소(프리뷰 바 오프셋·초안 주석)만 제거.
 *
 * 원문 주석:
 * 반응형 초안 셸 — 레이지클럽(워크룸) 셸 문법을 **북클럽 팔레트로 이식**한 사본.
 * 운영자 2026-08-12: "네비/푸터 등은 레이지 클럽 레퍼런스 최대한 살리고".
 *
 * 레이지클럽에서 그대로 가져온 규율 (docs/redesign/08 실측):
 *  - 전폭(컨테이너 max-width 없음) + 좌우 거터 하나로만 폭을 만든다
 *  - **햄버거 금지** — 데스크톱·모바일 동일한 2행 구조, 크기·간격만 축소
 *  - 로고는 grid item 이 아니라 absolute (그리드 아이템+height:100% 는 행 높이를
 *    되먹임해 헤더가 부푸는 버그가 있었다 — 2026-08-12 브랜드 텍스트 제거로
 *    마크가 1행 높이를 정하게 되면서 흐름 안 배치로 전환)
 *  - 푸터 15컬럼 → 720px 이하 4컬럼, 블록은 전부 2/5 로 스택
 *  - 이용약관은 이중 DOM + display 토글 (데스크톱 코너 / 모바일 SNS 윗줄)
 * 북클럽으로 바꾼 것: 색(잉크 #1a1208·종이 #f7f3ee·주황 #d2691e), 서체(SUIT),
 * 내비 항목(랜딩 섹션 앵커 5개 — NavBar.tsx 와 동일 구성·라벨).
 */

/**
 * 운영자 2026-08-17 두 건:
 *  · '선정도서' → 행위형으로. 섹션 제목은 '함께 읽는 책'(BookSection), 탭은 짧게 '읽는 책'
 *  · '진행방식' 탭 제거 — 진행 순서가 모임소개 하단으로 접혀 들어가 독립 섹션이 아니다
 *    ("별도로 상단 네비 메뉴까지 있을 정도로 중요해보이진 않아서")
 */
const NAV_ITEMS = [
  { id: "book", label: "읽는 책" },
  { id: "feature", label: "모임소개" },
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

export function LandingShell({
  children,
  holdIntro = false,
}: {
  children: React.ReactNode
  /** 진입 홀드를 강제로 켠다 — 검수 페이지(`preview/hero-check`) 전용 우회로.
   *  2026-08-17 모션 재점등으로 랜딩도 홀드가 켜졌으므로(HOLD_ENABLED=true) 이제는
   *  둘의 동작이 같다. 히어로가 다시 정적으로 내려가는 일이 생겨도 검수 페이지만은
   *  안무를 볼 수 있어야 하므로 플래그는 남긴다. 랜딩은 이 값을 넘기지 않는다. */
  holdIntro?: boolean
}) {
  const activeId = useActiveSection()
  // 진입 홀드 — 포스터만 뜨고, 그어짐이 끝나갈 무렵(또는 아무 입력에) 내비·푸터가,
  // 그로부터 3초 뒤 스티키 CTA 가 나타난다 (운영자 2026-08-12, 레이지클럽 인트로 문법)
  const { chrome, cta } = useChromeIntro(holdIntro)

  return (
    <div className={s.page} data-intro={chrome ? "show" : "hold"} data-cta={cta ? "show" : "hold"}>
      {/* 푸터 서체 Gothic A1 — 레이지클럽 Shell 과 동일 로드 (북클럽 전역엔 없음) */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@300;600&display=swap"
      />
      {/* JS 가 없으면 홀드가 풀리지 않는다 — 그 경우엔 처음부터 다 보이게 */}
      <noscript>
        <style>{CHROME_NOSCRIPT_CSS}</style>
      </noscript>
      {/* 진입 덮개 — 포스터 영역 밖을 포스터와 같은 색으로 가린다 (홀드 동안만) */}
      <div className={s.introMask} data-lz-mask aria-hidden />

      <header className={s.header}>
        {/* 브랜드 텍스트("레이지데이 북클럽")는 제거 — 동적 마크가 그 역할을 대신한다
            (운영자 2026-08-12: "상단 네비 1행에 레이지데이 북클럽 빼자") */}
        <LazydayLink href="/" className={s.navLogo} aria-label="레이지데이 북클럽 홈">
          <LazydayMark />
        </LazydayLink>

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

      {/* 푸터 — 운영자 2026-08-12: "레이지클럽과 북클럽은 푸터 정보를 그대로 가고,
          백그라운드 컬러와 로고, 로고 옆 텍스트만 달라지는 거야."
          → 구성·문구·서체(Gothic A1)는 레이지클럽 Shell 푸터와 동일. 다른 것은
          로고(북클럽 mono-ink)와 소개 문단(운영자 지정 원문)뿐 */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          {/* 푸터 마크 — 운영자 제공 새 로고(검정 박스 + LAZYDAY BOOKCLUB 세로 라벨).
              위치는 문구 왼쪽 그대로, 구 mono-ink L 심볼을 여기서 교체 (2026-08-12) */}
          <figure className={s.footerLogo}>
            <Image
              src="/linky-lounge/book-club/ldbc-logo-box.webp"
              alt="레이지데이 북클럽"
              width={620}
              height={810}
            />
          </figure>

          <div className={s.footerDesc}>
            {/* 운영자 지정 원문 (2026-08-12) — 임의 수정 금지 */}
            <p>저마다 다른 사유의 궤적 속 불협화음이 고전의 본질을 관통하여 하나의 선율이 되는 순간을 믿습니다.</p>
          </div>

          <div className={s.footerBiz}>
            <div>
              <span>주식회사 링키</span>
              <br />
              <span>대표: 안동민</span>
              <br />
              <span>사업자등록번호 557-81-03588</span>
              <br />
              <span>통신판매업신고 2026-별내-0077</span>
              <br />
              <span>개인정보관리책임자: 안동민</span>
              <br />
              <span>
                벤처기업확인:{" "}
                <a
                  href="https://www.smes.go.kr/venturein/pbntc/searchVntrCmpDtls?vniaSn=1172659&menuId=&cmpNm=%EC%A3%BC%EC%8B%9D%ED%9A%8C%EC%82%AC%20%EB%A7%81%ED%82%A4&rprsvNm=%EC%95%88%EB%8F%99%EB%AF%BC&bizRNo=5578103588&pageNo=1&areaCd=31&indstyCd=J&captcha=754051"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  제20260303030009호
                </a>{" "}
                (혁신성장유형)
              </span>
            </div>
          </div>

          <div className={s.footerContact}>
            <div>
              경기도 남양주시 별내3로 322, 404호
              <br />
              010-7444-5790
              <br />
              contact@linkylounge.com
            </div>
            <ul className={s.contractsInline}>
              <li>
                <LazydayLink href="/terms">이용약관</LazydayLink>
              </li>
              <li>
                <LazydayLink href="/privacy">개인정보처리방침</LazydayLink>
              </li>
            </ul>
            <div className={s.footerSns}>
              <a href="https://instagram.com/lazyday_bookclub" target="_blank" rel="noopener noreferrer" aria-label="인스타그램">
                <InstagramIcon />
              </a>
              <a href="https://pf.kakao.com/_gixaAX/chat" target="_blank" rel="noopener noreferrer" aria-label="카카오톡 채널">
                <KakaoIcon />
              </a>
            </div>
          </div>

          <ul className={s.contracts}>
            <li>
              <LazydayLink href="/terms">이용약관</LazydayLink>
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
