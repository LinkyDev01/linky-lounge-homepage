"use client"

import React, { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { SpacesGallery } from "./SpacesGallery"
import { LazydayLink } from "@/components/common/LazydayLink"
import s from "./lounge.module.css"

/**
 * 링키라운지 오시는 길 — 레이지클럽 톤 개편 (운영자 2026-09-09 "레이지클럽과 톤앤매너 맞추어서
 * 전체 UI/UX 개편해줘. 정보 자체는 수정할 게 없어. 그렇게 바로 배포해").
 *
 * 정보(주소·교통·전화·지도 링크·입구 두 걸음·주차 두 곳·Wi-Fi·화장실·문의 창구·사진)는 종전과
 * 글자 하나 다르지 않다. 바뀐 건 옷뿐 — 라운지 사이트의 공유 CSS 대신 `lounge.module.css`(§9 문법).
 * 종전 '지도 열기'와 '네이버 지도'는 같은 링크(naver.me/5K6llGWp)였다 — 하나로 합쳤다.
 * 카카오 러프맵 임베드·네이버 앱 딥링크·Wi-Fi 복사·탭 스크롤 추적은 종전 로직 그대로.
 */

const SECTION_IDS = ["location", "entrance", "parking"] as const
const TABS = ["찾아오는 길", "건물 입구", "주차안내"] as const

const Arrow = () => (
  <svg className={s.arrow} width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
    <path d="M1 7L7 1M7 1H2.5M7 1V5.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
  </svg>
)

export default function LazyDayLoungeInfoPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [copied, setCopied] = useState(false)

  const scrollToSection = useCallback((id: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    const cs = getComputedStyle(document.documentElement)
    const navH = parseInt(cs.getPropertyValue("--nav-h") || "41")
    const tabH = parseInt(cs.getPropertyValue("--tab-h") || "40")
    const top = el.getBoundingClientRect().top + window.scrollY - navH - tabH - 8
    window.scrollTo({ top, behavior: "smooth" })
  }, [])

  const openNaverMap = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const lat = 37.4786
    const lng = 126.9794
    const name = encodeURIComponent("링키라운지")
    const appname = encodeURIComponent("linkylounge.com")
    const webUrl = "https://naver.me/5K6llGWp"
    const ua = navigator.userAgent
    if (/Android/i.test(ua)) {
      window.location.href = `intent://place?lat=${lat}&lng=${lng}&name=${name}&appname=${appname}#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;end`
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      const nmapUrl = `nmap://place?lat=${lat}&lng=${lng}&name=${name}&appname=${appname}`
      const clickedAt = +new Date()
      window.location.href = nmapUrl
      setTimeout(() => {
        if (+new Date() - clickedAt < 2000) window.open(webUrl, "_blank")
      }, 1500)
    } else {
      window.open(webUrl, "_blank")
    }
  }, [])

  // Kakao roughmap embed (종전 그대로)
  useEffect(() => {
    const w = window as any
    if (!w.daum) w.daum = {}
    if (!w.daum.roughmap) {
      w.daum.roughmap = {
        phase: "prod",
        cdn: "207038f2_1774248312945",
        URL_KEY_DATA_LOAD_PRE: "https://t1.kakaocdn.net/roughmap/",
        url_protocal: "https:",
        url_cdn_domain: "//t1.kakaocdn.net",
      }
    }
    const script = document.createElement("script")
    script.charset = "UTF-8"
    script.src = "https://t1.kakaocdn.net/kakaomapweb/roughmap/place/prod/207038f2_1774248312945/roughmapLander.js"
    script.onload = () => {
      new w.daum.roughmap.Lander({
        timestamp: "1775021094987",
        key: "kc7x8vbrqtt",
        mapWidth: "640",
        mapHeight: "360",
      }).render()
    }
    document.body.appendChild(script)
    return () => { if (script.parentNode) script.parentNode.removeChild(script) }
  }, [])

  // 탭 스크롤 추적 (종전 그대로 — 오프셋 변수만 이 모듈 값)
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement)
    const navH = parseInt(cs.getPropertyValue("--nav-h") || "41")
    const tabH = parseInt(cs.getPropertyValue("--tab-h") || "40")
    const offset = navH + tabH + 20
    const onScroll = () => {
      let current = 0
      SECTION_IDS.forEach((id, i) => {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= offset) current = i
      })
      setActiveTab(current)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const copyWifi = useCallback(() => {
    navigator.clipboard.writeText("lkylkylky3").then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  return (
    <div className={s.root}>
      <header className={s.header}>
        <span className={s.current}>링키라운지</span>
        <LazydayLink href="/">레이지데이 북클럽<Arrow /></LazydayLink>
      </header>

      <nav className={s.tabs} aria-label="구간">
        {TABS.map((label, i) => (
          <a
            key={label}
            href={`#${SECTION_IDS[i]}`}
            className={activeTab === i ? s.tabOn : s.tab}
            onClick={(e) => scrollToSection(SECTION_IDS[i], e)}
          >
            {label}
          </a>
        ))}
      </nav>

      <main className={s.wrap}>
        <h1 className={s.headline}>링키라운지</h1>
        <p className={s.headSub}>with 레이지데이 북클럽</p>
        <Image src="/linky-lounge/gallary/main-full.webp" alt="링키라운지 공간 내부" width={920} height={690} className={`${s.photo} ${s.hero}`} priority />

        <div className={s.list}>
          <div className={s.row}>
            <span className={s.rowLabel}>주소</span>
            <p className={s.rowBody}>서울 동작구 동작대로7길 44<span className={s.rowSub}>지하 1층 링키라운지</span></p>
          </div>
          <div className={s.row}>
            <span className={s.rowLabel}>대중교통</span>
            <p className={s.rowBody}>사당역 10번 출구 도보 3분<span className={s.rowSub}>지하철 2호선 · 4호선</span></p>
          </div>
          <div className={s.row}>
            <span className={s.rowLabel}>문의</span>
            <p className={s.rowBody}><a href="tel:0507-1472-5790" className={s.link}>0507-1472-5790</a></p>
          </div>
        </div>

        {/* ── 찾아오는 길 ── */}
        <section id="location" className={s.section}>
          <span className={s.label}>위치</span>
          <h2 className={s.title}>찾아오는 길</h2>
          <div className={s.map}>
            <div id="daumRoughmapContainer1775021094987" className={`root_daum_roughmap root_daum_roughmap_landing ${s.mapBox}`} />
          </div>
          <p className={`${s.rowBody} ${s.mapMeta}`}>
            서울 동작구 동작대로7길 44
            <span className={s.rowSub}>사당역 10번 출구 도보 3분 · 지하 1층</span>
          </p>
          <p className={s.links}>
            <a href="https://naver.me/5K6llGWp" rel="noopener noreferrer" className={s.link} onClick={openNaverMap}>네이버 지도<Arrow /></a>
            <a href="https://place.map.kakao.com/59708189" target="_blank" rel="noopener noreferrer" className={s.link}>카카오맵<Arrow /></a>
          </p>
        </section>

        {/* ── 건물 입구 ── */}
        <section id="entrance" className={s.section}>
          <span className={s.label}>입구 찾기 가이드</span>
          <h2 className={s.title}>링키라운지 건물 입구 안내</h2>
          <p className={s.para}>
            링키라운지는 <span className={s.strong}>지하 1층</span>에 위치해 있습니다.<br />
            위치가 헷갈리시면 아래 건물 입구 정보를 확인하세요.
          </p>
          <div className={s.steps}>
            <div className={s.step}>
              <div className={s.stepHead}>
                <span className={s.stepNum}>01</span>
                <p className={s.stepTitle}>트릭킹짐 건물 찾기</p>
              </div>
              <p className={s.stepBody}>
                사당역 10번 출구에서 도보 3분.<br />
                건물 간판에 <span className={s.strong}>트릭킹짐(W 로고) + 25시 노래방</span>이 보이면 맞습니다.<br />
                건물 정면 유리문으로 진입하세요.
              </p>
              <Image src="/location/entrance-building.webp" alt="트릭킹짐 건물 외관" width={600} height={450} className={s.photo} />
            </div>
            <div className={s.step}>
              <div className={s.stepHead}>
                <span className={s.stepNum}>02</span>
                <p className={s.stepTitle}>왼쪽 지하 계단으로 내려오기</p>
              </div>
              <p className={s.stepBody}>
                건물 진입 후 <span className={s.strong}>왼쪽 지하 계단</span>을 따라 내려옵니다.<br />
                계단 아래 트릭킹짐(B1) 간판이 보이고,<br />
                <span className={s.strong}>정면 링키라운지 문</span>으로 들어오시면 됩니다.
              </p>
              <Image src="/location/entrance-stairs.webp" alt="지하 계단 아래 링키라운지 입구" width={600} height={800} className={s.photo} />
            </div>
          </div>
        </section>

        {/* ── 주차안내 ── */}
        <section id="parking" className={s.section}>
          <span className={s.label}>주차 안내</span>
          <h2 className={s.title}>주차하기</h2>
          <div className={s.parkList}>
            {[
              { name: "사당1호 공영주차장", walk: "도보 4분", href: "https://naver.me/53lKjoLk" },
              { name: "사당2호 공영주차장", walk: "도보 5분", href: "https://naver.me/5YFcoQBD" },
            ].map(({ name, walk, href }) => (
              <a key={name} href={href} target="_blank" rel="noopener noreferrer" className={s.parkRow}>
                <span>
                  <p className={s.parkName}>{name}</p>
                  <span className={s.parkMeta}>공영 유료 · {walk}</span>
                </span>
                <span className={s.parkGo}>지도<Arrow /></span>
              </a>
            ))}
          </div>
          {/* 북클럽용 크롭본(우측 쓰레기 폐기장소 주석 제거) — 원본 parking.png는 라운지 페이지가 사용 */}
          <Image src="/location/parking-v2.webp" alt="주차장 입구 위치" width={600} height={384} className={s.photo} />
        </section>

        {/* ── Wi-Fi · 화장실 ── */}
        <section className={s.section}>
          <span className={s.label}>이용 정보</span>
          <h2 className={s.title}>Wi-Fi · 화장실</h2>
          <div className={s.list}>
            <div className={s.row}>
              <span className={s.rowLabel}>Wi-Fi</span>
              <p className={s.rowBody}>
                LINKY_LOUNGE
                <button type="button" className={s.textBtn} onClick={copyWifi}>비밀번호 복사</button>
                <span className={`${s.copied} ${copied ? s.copiedOn : ""}`} aria-live="polite">복사됨</span>
                <span className={s.rowSub}>비밀번호: lkylkylky3</span>
              </p>
            </div>
            <div className={s.row}>
              <span className={s.rowLabel}>화장실</span>
              <p className={s.rowBody}>
                B1 · 1층 공용
                <span className={s.rowSub}>1층 이용 시 스위치 아래 <span className={s.strong}>와인잔 카드키</span> 지참</span>
              </p>
            </div>
          </div>
        </section>

        {/* ── 문의 ── */}
        <section className={s.section}>
          <span className={s.label}>문의</span>
          <h2 className={s.title}>레이지데이 문의</h2>
          <p className={s.para}>궁금하신 점은 카카오톡으로 편하게 말씀 주세요.</p>
          <p className={s.ctaWrap}>
            <a href="https://pf.kakao.com/_cuWDn" target="_blank" rel="noopener noreferrer" className={s.ctaLink}>카카오톡으로 문의하기<Arrow /></a>
          </p>
          <div className={s.list}>
            <div className={s.row}>
              <span className={s.rowLabel}>전화</span>
              <p className={s.rowBody}><a href="tel:0507-1472-5790" className={s.link}>0507-1472-5790</a></p>
            </div>
            <div className={s.row}>
              <span className={s.rowLabel}>이메일</span>
              <p className={s.rowBody}><a href="mailto:linkylounge@gmail.com" className={s.link}>linkylounge@gmail.com</a></p>
            </div>
            <div className={s.row}>
              <span className={s.rowLabel}>인스타그램</span>
              <p className={s.rowBody}><a href="https://instagram.com/lazyday_bookclub" target="_blank" rel="noopener noreferrer" className={s.link}>@lazyday_bookclub<Arrow /></a></p>
            </div>
          </div>
        </section>

        {/* ── 공간 둘러보기 — 경량 썸네일 + 라이트박스 (2026-07-12 이식본, 옷만 바꿈) ── */}
        <SpacesGallery />
      </main>
    </div>
  )
}
