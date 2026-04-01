"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState, useCallback } from "react"
import styles from "./page.module.css"

const SECTION_IDS = ["location", "entrance", "parking", "checkout"] as const

export default function LoungeInfoPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [checked, setChecked] = useState<boolean[]>(Array(6).fill(false))
  const [wifiToast, setWifiToast] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  const scrollToSection = useCallback((id: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h") || "56")
    const tabH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--tab-h") || "50")
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

  // Tab scroll tracking
  useEffect(() => {
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h") || "56")
    const tabH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--tab-h") || "50")
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

  const toggleCheck = useCallback((i: number) => {
    setChecked(prev => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }, [])

  const copyWifi = useCallback(() => {
    navigator.clipboard.writeText("lkylkylky3").then(() => {
      setWifiToast(true)
      setTimeout(() => setWifiToast(false), 2000)
    })
  }, [])

  const checklistItems = [
    <><strong className={styles.checkoutTextStrong}>예약 시간 엄수</strong></>,
    <><strong className={styles.checkoutTextStrong}>쓰레기 분리수거 &amp; 설거지</strong> 필수</>,
    <><strong className={styles.checkoutTextStrong}>가구 및 소품 원위치</strong></>,
    <><strong className={styles.checkoutTextStrong}>쓰레기 폐기</strong> — 나가서 왼쪽 야채가게 옆 전봇대 앞</>,
    <><strong className={styles.checkoutTextStrong}>냉난방기 OFF</strong></>,
    <><strong className={styles.checkoutTextStrong}>문단속</strong> — 도어락 <strong className={styles.checkoutTextStrong}>3초 터치</strong>로 잠금 확인</>,
  ]

  return (
    <div className={styles.root}>
      {/* ── Top Nav ── */}
      <nav className={styles.topnav}>
        <div className={styles.topnavInner}>
          <Link href="/" className={styles.topnavLogo}>
            <Image src="/logos/logoandtext.png" alt="링키라운지" width={160} height={30} className={styles.logoCombined} />
          </Link>
        </div>
      </nav>

      {/* ── Section Tabs ── */}
      <div className={styles.sectionTabs}>
        <div
          className={styles.sectionTabsInner}
          style={{ "--active-tab": activeTab } as React.CSSProperties}
        >
          <div className={styles.tabIndicator} aria-hidden="true" />
          {(["찾아오는 길", "건물 입구", "주차안내", "퇴실 체크리스트"] as const).map((label, i) => (
            <a
              key={label}
              href={`#${SECTION_IDS[i]}`}
              className={`${styles.tabLink} ${activeTab === i ? styles.tabLinkActive : ""}`}
              onClick={(e) => scrollToSection(SECTION_IDS[i], e)}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <Image
          src="/linky-lounge/gallary/main.jpg"
          alt="링키라운지 공간 내부"
          fill
          className={styles.heroImg}
          priority
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <Image src="/logos/logo_text.png" alt="링키라운지" width={220} height={44} className={styles.heroLogoText} />
          <p className={styles.heroSub}>with 레이지데이 북클럽</p>
        </div>
      </div>

      {/* ── Quick Info ── */}
      <div className={styles.quickBar}>
        <div className={styles.wrap}>
          <div className={styles.quickBarSection}>
            <div className={styles.quickItems}>
              <div className={styles.quickItem}>
                <div className={styles.quickIcon}>📍</div>
                <div>
                  <p className={styles.quickLabel}>주소</p>
                  <p className={styles.quickValue}>
                    서울 동작구 동작대로7길 44
                    <span className={styles.quickValueSmall}>지하 1층 링키라운지</span>
                  </p>
                </div>
              </div>
              <div className={styles.quickItem}>
                <div className={styles.quickIcon}>🚇</div>
                <div>
                  <p className={styles.quickLabel}>대중교통</p>
                  <p className={styles.quickValue}>
                    사당역 10번 출구 도보 3분
                    <span className={styles.quickValueSmall}>지하철 2호선 · 4호선</span>
                  </p>
                </div>
              </div>
              <div className={styles.quickItem}>
                <div className={styles.quickIcon}>📞</div>
                <div>
                  <p className={styles.quickLabel}>문의</p>
                  <p className={styles.quickValue}>
                    <a href="tel:0507-1472-5790" className={styles.quickValueLink}>0507-1472-5790</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 찾아오는 길 ── */}
      <div id="location" className={`${styles.mapSection} ${styles.scrollAnchor}`}>
        <div className={styles.wrap}>
          <div className={styles.section}>
            <p className={styles.sectionTag}>위치</p>
            <h2 className={styles.sectionTitle}>찾아오는 길</h2>
            <div className={styles.naverMapCard}>
              <div className={styles.naverMapPreview}>
                {mapLoaded ? (
                  <iframe
                    src="https://map.naver.com/p/entry/place/2050370003"
                    allowFullScreen
                    title="링키라운지 위치"
                  />
                ) : (
                  <button className={styles.mapPlaceholder} onClick={() => setMapLoaded(true)}>
                    <div className={styles.mapPlaceholderIcon}>
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.15"/>
                      </svg>
                    </div>
                    <p className={styles.mapPlaceholderTitle}>지도 보기</p>
                    <p className={styles.mapPlaceholderSub}>탭하면 네이버 지도를 불러옵니다</p>
                  </button>
                )}
              </div>
              <div className={styles.naverMapFooter}>
                <div>
                  <p className={styles.naverMapInfoTitle}>서울 동작구 동작대로7길 44</p>
                  <p className={styles.naverMapInfoSub}>사당역 10번 출구 도보 3분 · 지하 1층</p>
                </div>
                <a href="https://naver.me/5K6llGWp" rel="noopener noreferrer" className={styles.naverOpenBtn} onClick={openNaverMap}>
                  지도 열기
                </a>
              </div>
            </div>
            <div className={styles.mapActions}>
              <a href="https://naver.me/5K6llGWp" rel="noopener noreferrer" className={`${styles.mapBtn} ${styles.mapBtnNaver}`} onClick={openNaverMap}>
                네이버 지도
              </a>
              <a href="https://place.map.kakao.com/59708189" target="_blank" rel="noopener noreferrer" className={`${styles.mapBtn} ${styles.mapBtnKakao}`}>
                카카오맵
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── 건물 입구 ── */}
      <div id="entrance" className={`${styles.entranceSection} ${styles.scrollAnchor}`}>
        <div className={styles.wrap}>
          <div className={styles.section}>
            <p className={styles.sectionTag}>입구 찾기 가이드</p>
            <h2 className={styles.sectionTitle}>링키라운지 건물 입구 안내</h2>
            <div className={styles.noticeBox}>
              <p className={styles.noticeText}>
                ⚠️ 링키라운지는 <strong className={styles.noticeTextStrong}>지하 1층</strong>에 위치해 있습니다.<br />
                위치가 헷갈리시면 아래 건물 입구 정보를 확인하세요.
              </p>
            </div>
            <div className={styles.entranceSteps}>
              <div className={styles.entranceStep}>
                <p className={styles.stepNum}>Step 01</p>
                <p className={styles.stepTitle}>트릭킹짐 건물 찾기</p>
                <p className={styles.stepDesc}>
                  사당역 10번 출구에서 도보 3분.<br />
                  건물 간판에 <strong className={styles.stepDescStrong}>트릭킹짐(W 로고) + 25시 노래방</strong>이 보이면 맞습니다.<br />
                  건물 정면 유리문으로 진입하세요.
                </p>
                <Image src="/location/entrance-building.png" alt="트릭킹짐 건물 외관" width={600} height={450} className={styles.stepPhoto} />
              </div>
              <div className={styles.entranceStep}>
                <p className={styles.stepNum}>Step 02</p>
                <p className={styles.stepTitle}>왼쪽 지하 계단으로 내려오기</p>
                <p className={styles.stepDesc}>
                  건물 진입 후 <strong className={styles.stepDescStrong}>왼쪽 지하 계단</strong>을 따라 내려옵니다.<br />
                  계단 아래 트릭킹짐(B1) 간판이 보이고,<br />
                  <strong className={styles.stepDescStrong}>정면 링키라운지 문</strong>으로 들어오시면 됩니다.
                </p>
                <Image src="/location/entrance-stairs.png" alt="지하 계단 아래 링키라운지 입구" width={600} height={800} className={styles.stepPhoto} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 주차안내 ── */}
      <div id="parking" className={`${styles.parkingSection} ${styles.scrollAnchor}`}>
        <div className={styles.wrap}>
          <div className={styles.section}>
            <p className={styles.sectionTag}>주차 안내</p>
            <h2 className={styles.sectionTitle}>주차하기</h2>
            <div className={styles.parkingCards}>
              {[
                { name: "사당1호 공영주차장", walk: "도보 4분", href: "https://naver.me/53lKjoLk" },
                { name: "사당2호 공영주차장", walk: "도보 5분", href: "https://naver.me/5YFcoQBD" },
              ].map(({ name, walk, href }) => (
                <a key={name} href={href} target="_blank" rel="noopener noreferrer" className={styles.parkingCardLink}>
                  <div className={styles.parkingPinIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className={styles.parkingCardInfo}>
                    <span className={styles.parkingTagBadge}>공영 유료</span>
                    <p className={styles.parkingCardName2}>{name}</p>
                    <p className={styles.parkingCardWalk}>{walk}</p>
                  </div>
                  <div className={styles.parkingCardChevron}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </a>
              ))}
            </div>
            <Image src="/location/parking.png" alt="주차장 입구 위치" width={600} height={300} className={styles.parkingPhoto} />
          </div>
        </div>
      </div>

      {/* ── 공간 시설 ── */}
      <div className={styles.facilitiesSection}>
        <div className={styles.wrap}>
          <div className={styles.section}>
            <p className={styles.sectionTag}>공간 정보</p>
            <h2 className={styles.sectionTitle}>공간 시설 안내</h2>
            <div className={styles.facilitiesGrid}>
              {[
                { icon: "🪑", label: "수용 인원", desc: "최대 40명\n단체 모임·워크샵 가능" },
                { icon: "📽️", label: "빔 프로젝터", desc: "100인치 스크린\n넷플릭스·유튜브 가능" },
                { icon: "🔊", label: "스피커", desc: "BOSE 블루투스" },
                { icon: "💻", label: "노트북", desc: "15인치 구비" },
                { icon: "🍷", label: "와인잔", desc: "인원 맞춤 구비\n(문의 필요)" },
                { icon: "✨", label: "인테리어", desc: "바우하우스 감성" },
              ].map(({ icon, label, desc }) => (
                <div key={label} className={styles.facilityItem}>
                  <span className={styles.facIcon}>{icon}</span>
                  <div>
                    <p className={styles.facLabel}>{label}</p>
                    <p className={styles.facDesc}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Wi-Fi & 화장실 ── */}
      <div className={styles.infoSection}>
        <div className={styles.wrap}>
          <div className={styles.section}>
            <p className={styles.sectionTag}>이용 정보</p>
            <h2 className={styles.sectionTitle}>Wi-Fi · 화장실</h2>
            <div className={styles.infoCards}>
              <div className={styles.infoCard}>
                <span className={styles.infoCardIcon}>📶</span>
                <div className={styles.infoCardFlex}>
                  <p className={styles.infoCardLabel}>Wi-Fi</p>
                  <div className={styles.wifiRow}>
                    <p className={styles.infoCardValue}>LINKY_LOUNGE</p>
                    <button className={styles.wifiBtn} onClick={copyWifi}>비밀번호 복사</button>
                    <span className={`${styles.wifiToast} ${wifiToast ? styles.wifiToastVisible : ""}`}>✓ 복사됨</span>
                  </div>
                  <p className={styles.infoCardSub}>비밀번호: lkylkylky3</p>
                </div>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoCardIcon}>🚽</span>
                <div>
                  <p className={styles.infoCardLabel}>화장실</p>
                  <p className={styles.infoCardValue}>B1 · 1층 공용</p>
                  <p className={styles.infoCardSub}>
                    1층 이용 시 스위치 아래 <strong className={styles.infoCardSubAccent}>와인잔 카드키</strong> 지참
                  </p>
                </div>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoCardIcon}>🔐</span>
                <div>
                  <p className={styles.infoCardLabel}>도어락 비밀번호</p>
                  <p className={styles.infoCardValue}>보증금 입금 후 전달</p>
                  <p className={styles.infoCardSub}>입금 완료 시 도어락 키를 별도 안내드립니다.<br />즐거운 시간 되세요 😊</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 퇴실 체크리스트 ── */}
      <div id="checkout" className={`${styles.checkoutSection} ${styles.scrollAnchor}`}>
        <div className={styles.wrap}>
          <div className={styles.section}>
            <p className={styles.sectionTag}>퇴실 안내</p>
            <h2 className={styles.sectionTitle}>퇴실 체크리스트</h2>
            <ul className={styles.checkoutList}>
              {checklistItems.map((item, i) => (
                <li key={i} className={styles.checkoutItem} onClick={() => toggleCheck(i)}>
                  <span className={`${styles.checkoutBox} ${checked[i] ? styles.checkoutBoxChecked : ""}`}>
                    {checked[i] && (
                      <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                        <path d="M1.5 5L5 8.5L11.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <p className={`${styles.checkoutText} ${checked[i] ? styles.checkoutTextChecked : ""}`}>
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── 문의 ── */}
      <div className={styles.ctaSection}>
        <div className={styles.wrap}>
          <div className={styles.section}>
            <p className={styles.sectionTag}>문의 &amp; 예약</p>
            <h2 className={styles.sectionTitle}>대관 문의</h2>
            <p className={styles.ctaDesc}>궁금하신 점은 카카오톡으로 편하게 말씀 주세요.</p>
            <a href="https://pf.kakao.com/_cuWDn" target="_blank" rel="noopener noreferrer" className={styles.ctaBtn}>
              카카오톡으로 문의하기
            </a>
            <div className={styles.ctaDivider} />
            <div className={styles.contactRow}>
              <a href="tel:0507-1472-5790" className={styles.contactChip}>
                <p className={styles.contactChipLabel}>전화</p>
                <p className={styles.contactChipValue}>0507-1472-5790</p>
              </a>
              <a href="mailto:linkylounge@gmail.com" className={styles.contactChip}>
                <p className={styles.contactChipLabel}>이메일</p>
                <p className={styles.contactChipValue}>linkylounge@gmail.com</p>
              </a>
              <a href="https://instagram.com/linky_lounge" target="_blank" rel="noopener noreferrer" className={styles.contactChip}>
                <p className={styles.contactChipLabel}>인스타그램</p>
                <p className={styles.contactChipValue}>@linky_lounge</p>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerWrap}>
          <div className={styles.footerGrid}>
            <div>
              <h4 className={styles.footerSectionTitle}>사업자정보</h4>
              <ul className={styles.footerList}>
                <li>주식회사 링키</li>
                <li>대표 : 안동민 | 개인정보관리책임자 : 안동민</li>
                <li>사업자등록번호 : 557-81-03588 | 통신판매업신고번호: 2026-별내-0077</li>
                <li>이메일 : linkylounge@gmail.com | 대표번호 : 010-7444-5790</li>
                <li>주소: 경기도 남양주시 별내3로 322, 404호</li>
              </ul>
            </div>
            <div>
              <h4 className={styles.footerSectionTitle}>고객지원</h4>
              <ul className={styles.footerList}>
                <li><a href="/policy" className={styles.footerLink}>교환환불정책</a></li>
                <li><a href="https://www.instagram.com/linky_lounge" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Instagram</a></li>
                <li><a href="http://pf.kakao.com/_cuWDn" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>KakaoTalk</a></li>
                <li><a href="https://naver.me/FLebi2a9" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Naver</a></li>
              </ul>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p className={styles.footerCopy}>© 2026 Linky Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
