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
        <div className={styles.sectionTabsInner}>
          {(["찾아오는 길", "건물 입구", "주차안내", "퇴실 체크리스트"] as const).map((label, i) => (
            <a
              key={label}
              href={`#${SECTION_IDS[i]}`}
              className={`${styles.tabLink} ${activeTab === i ? styles.tabLinkActive : ""}`}
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
                <iframe
                  src="https://map.naver.com/p/entry/place/2050370003"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="링키라운지 위치"
                />
              </div>
              <div className={styles.naverMapFooter}>
                <div>
                  <p className={styles.naverMapInfoTitle}>서울 동작구 동작대로7길 44</p>
                  <p className={styles.naverMapInfoSub}>사당역 10번 출구 도보 3분 · 지하 1층</p>
                </div>
                <a href="https://naver.me/5K6llGWp" target="_blank" rel="noopener noreferrer" className={styles.naverOpenBtn}>
                  지도 열기
                </a>
              </div>
            </div>
            <div className={styles.mapActions}>
              <a href="https://naver.me/5K6llGWp" target="_blank" rel="noopener noreferrer" className={`${styles.mapBtn} ${styles.mapBtnNaver}`}>
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
                ⚠️ 링키라운지는 <strong className={styles.noticeTextStrong}>지하 1층</strong>에 위치해 입구가 다소 찾기 어려울 수 있습니다.<br />
                아래 사진을 참고해 주세요. 헷갈리시면 카카오톡 또는 전화로 문의 주세요.
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
                <p className={styles.stepTitle}>왼쪽 지하 계단 소잤운 내려오기</p>
                <p className={styles.stepDesc}>
                  걺물 진장 후 <strong className={styles.stepDescStrong}>좛쪩 지하 계단</strong>을 따라 내려옵니다.<br />
                  계단 아래 트릭킹짐(B1) 간판읭 보이쫠� 별,<br />
                  <strong className={styles.stepDescStrong}>앂면 링키라운지 문</strong>으로 들어오시면 됩니다.
                </p>
                <Image src="/location/entrance-stairs.png" alt="지하 계단 아래 링키라운지 입구" width={600} height={800} className={styles.stepPhoto} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*  ── 주차안내 ── */}
      <div id="parking" className={`${styles.parkingSection} ${styles.scrollAnchor}`}>
        <div className={styles.wrap}>
          <div className={styles.section}>
            <p className={styles.sectionTag}>주차 안내</p>
            <h2 className={styles.sectionTitle}>주차았기</h2>
            <div className={styles.parkingCards}>
              <div className={styles.parkingCard}>
                <div className={styles.parkingCardHead}>
                  <span className={`${styles.parkingBadge} ${styles.badgePaid}`}>공은 유롌</span>
                  <span className={styles.parkingName}>사당 공영주차장</span>
                </div>
                <p className={styles.parkingDesc}>
                  • <a href="https://naver.me/53lKjoLk" target="_blank" rel="noopener noreferrer" className={styles.parkingDescLink}>사당1호 공영주차장</a> — 도보 4분<br />
                  • <a href="https://naver.me/5YFcoQBD" target="_blank" rel="noopener noreferrer" className={styles.parkingDescLink}>사당2호 공영주차장</a> — 도보 5분
                </p>
              </div>
            </div>
            <Image src="/location/parking.png" alt="�;��
���R��^�Z���N˙�"v�GF�׳c��V�v�C׳3�6�74��S׷7G��W2�&���u��F������F�c���F�c���F�cࠢ��)H)H�;^�Bȹ��JB)H)H��Т�F�b6�74��S׷7G��W2�f6�ƗF�W56V7F������F�b6�74��S׷7G��W2�w&���F�b6�74��S׷7G��W2�6V7F������6�74��S׷7G��W2�6V7F���Fw��;^�B�	^�;C���ƃ"6�74��S׷7G��W2�6V7F���F�F�W��;^�Bȹ��JB�X��+C���#��F�b6�74��S׷7G��W2�f6�ƗF�W4w&�G�������6��/	��"��&Vâ.ȉ�ɪ��ێɹ"�FW63�.�Yθ�C��U���+B�����L+~ɸ����;R���R"�����6��/	�;����"��&Vâ.��B�HN���	��K"�FW63�#�ێ˙�ȪN�κk��K~�Hκj�ȪL+~��ةλ�����R"�����6��/	�H�"��&Vâ.ȪN�K�˺B"�FW63�$$�4R��N�:�؊�ȪB"�����6��/	�+�"��&Vâ.�[�ث��h"�FW63�#^�ێ˙��Zλ�B"�����6��/	��r"��&Vâ.ɘ�ێ��B"�FW63�.�ێɹ�y��jB�Zλ�E�⎺ˎ�ق�XNɩB�"�����6��.)ʂ"��&Vâ.�ێ�Xκj��kB"�FW63�.�	Nɫ�Y�ɫȪB�	�K"����������6����&V��FW62Ғ�����F�b�W�׶�&V��6�74��S׷7G��W2�f6�ƗG��FV����7�6�74��S׷7G��W2�f4�6���綖6�����7���F�c��6�74��S׷7G��W2�f4�&V����&V������6�74��S׷7G��W2�f4FW67��FW67������F�c���F�c���Т��F�c���F�c���F�c���F�cࠢ��)H)Hv��f�bٙN��^ȺB)H)H��Т�F�b6�74��S׷7G��W2��f�6V7F������F�b6�74��S׷7G��W2�w&���F�b6�74��S׷7G��W2�6V7F������6�74��S׷7G��W2�6V7F���Fw����Nɪ��	^�;C���ƃ"6�74��S׷7G��W2�6V7F���F�F�W��v��f�+rٙN��^ȺC���#��F�b6�74��S׷7G��W2��f�6&G7���F�b6�74��S׷7G��W2��f�6&G���7�6�74��S׷7G��W2��f�6&D�6����	�;c��7���F�b6�74��S׷7G��W2��f�6&Df�W����6�74��S׷7G��W2��f�6&D�&V���v��f�����F�b6�74��S׷7G��W2�v�f�&�w���6�74��S׷7G��W2��f�6&Ef�VW��Ĕ䵕���T�tS����'WGF��6�74��S׷7G��W2�v�f�'F����6Ɩ6�׶6��v�f��N��(�ً��;^�*���'WGF����7�6�74��S׶G�7G��W2�v�f�F�7G�G�v�f�F�7B�7G��W2�v�f�F�7Ef�6�&�R�"'���)�2�;^�*ι
���7����F�c��6�74��S׷7G��W2��f�6&E7V'�N��(�ً��Ʒ�Ʒ�Ʒ�3�����F�c���F�c��F�b6�74��S׷7G��W2��f�6&G���7�6�74��S׷7G��W2��f�6&D�6����	�����7���F�c��6�74��S׷7G��W2��f�6&D�&V���ٙN��^ȺC����6�74��S׷7G��W2��f�6&Ef�VW��#+rˋR�;^ɪ�����6�74��S׷7G��W2��f�6&E7V'��ˋR��Nɪ�ȹ�ȪN��N˙��XN���7G&��r6�74��S׷7G��W2��f�6&E7V$66V�G��ɘ�ێ��B˛N�9��*C��7G&��s��x��������F�c���F�c��F�b6�74��S׷7G��W2��f�6&G���7�6�74��S׷7G��W2��f�6&D�6����	�I��7���F�c��6�74��S׷7G��W2��f�6&D�&V����N�kN�����N��(�ً�����6�74��S׷7G��W2��f�6&Ef�VW��;N�iޫ����^���ٸB�N�������6�74��S׷7G��W2��f�6&E7V'����^���ɘN�8�ȹ���N�kN����*N�[��8N��B�X��+N�9κk޸����B��'"���i�ɫBȹΫB�	��K�ɩB	��������F�c���F�c���F�c���F�c���F�c���F�cࠢ��)H)H�{NȺB�+N�κj�ȪNث�)H)H��Т�F�b�C�&6�V6��WB"6�74��S׶G�7G��W2�6�V6��WE6V7F����G�7G��W2�67&����6��'����F�b6�74��S׷7G��W2�w&���F�b6�74��S׷7G��W2�6V7F������6�74��S׷7G��W2�6V7F���Fw���{NȺB�X��+C���ƃ"6�74��S׷7G��W2�6V7F���F�F�W���{NȺB�+N�κj�ȪNث����#��V�6�74��S׷7G��W2�6�V6��WDƗ7G���6�V6�Ɨ7D�FV�2�����FV���������ƒ�W�׶��6�74��S׷7G��W2�6�V6��WD�FV����6Ɩ6�ײ����F�vv�T6�V6�������7�6�74��S׶G�7G��W2�6�V6��WD&���G�6�V6�VE����7G��W2�6�V6��WD&��6�V6�VB�"'����6�V6�VE���bb���7frv�GF��#2"�V�v�C�#"f�Wt&���#2"f����&���R#��F�C�$��RT�R��T��R�R"7G&��S�'v��FR"7G&��Uv�GF��#""7G&��TƖ�V6�'&�V�B"7G&��TƖ�V�����'&�V�B"����7fs��Т��7���6�74��S׶G�7G��W2�6�V6��WEFW�G�G�6�V6�VE����7G��W2�6�V6��WEFW�D6�V6�VB�"'�����FV�Т�����Ɠ���Т��V����F�c���F�c���F�cࠢ��)H)H�ˎ�ق)H)H��Т�F�b6�74��S׷7G��W2�7F6V7F������F�b6�74��S׷7G��W2�w&���F�b6�74��S׷7G��W2�6V7F������6�74��S׷7G��W2�6V7F���Fw��ˎ�قf��Ɉ��[����ƃ"6�74��S׷7G��W2�6V7F���F�F�W����N��N�)����H�ˎ�ك���#��6�74��S׷7G��W2�7FFW67��h����Y�Ⱥ�	��˛N˛NɊN�j��κ����Y��(��y�H�;��K�ɩB������&Vc�&�GG3���b����6����7UtF�"F&vWC�%�&��"&V��&���V�W"��&VfW'&W""6�74��S׷7G��W2�7F'F���˛N˛NɊN�j��κ��ˎ�َ�Y��� �����F�b6�74��S׷7G��W2�7FF�f�FW'����F�b6�74��S׷7G��W2�6��F7E&�w����&Vc�'FVãSr�Cs"�Ss�"6�74��S׷7G��W2�6��F7D6�����6�74��S׷7G��W2�6��F7D6���&V����NٙC����6�74��S׷7G��W2�6��F7D6��f�VW��Sr�Cs"�Ss���������&Vc�&���F�Ɩ淖��V�vTv����6��"6�74��S׷7G��W2�6��F7D6�����6�74��S׷7G��W2�6��F7D6���&V�����N��N�������6�74��S׷7G��W2�6��F7D6��f�VW��Ɩ淖��V�vTv����6����������&Vc�&�GG3�����7Fw&��6���Ɩ淕���V�vR"F&vWC�%�&��"&V��&���V�W"��&VfW'&W""6�74��S׷7G��W2�6��F7D6�����6�74��S׷7G��W2�6��F7D6���&V����ێȪN�8�{�������6�74��S׷7G��W2�6��F7D6��f�VW��Ɩ淕���V�vS��������F�c���F�c���F�c���F�cࠢ��)H)Hf��FW")H)H��Т�f��FW"6�74��S׷7G��W2�f��FW'���F�b6�74��S׷7G��W2�w&���F�b6�74��S׷7G��W2�f��FW$���W'��Ė�vR7&3�"���v�2���v���r"�C�.�x�*N���ɫN�x"v�GF�׳#g��V�v�C׳#g�6�74��S׷7G��W2�f��FW$��v��&�����6�74��S׷7G��W2�f��FW$6����*�##RƖ淒��V�vR+rƖ淖��V�vTv����6�������F�c���F�c���f��FW#���F�c����
