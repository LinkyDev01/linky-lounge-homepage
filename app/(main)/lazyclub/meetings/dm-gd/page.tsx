import type { Metadata } from "next"
import { WorkroomShell } from "../../Shell"
import { CoffeeBarForm } from "./CoffeeBarForm"
import styles from "../../home.module.css"
import cb from "./coffeebar.module.css"

/**
 * 동민과 고든 커피앤바 — 안동민·천고든 소개의 '네비올로'·'네그로니' 링크가 닿는 곳.
 * (운영자 2026-08-24: "네비올로 또는 네그로니 연결링크를 위이미지의 참가폼이 되게 할 거고")
 *
 * ⚠ **정적 세그먼트다** — `meetings/[slug]` 가 아니라 `meetings/dm-gd`.
 *   one-day-config 의 ONE_DAY_MEETINGS 에 넣으면 모임 목록·일정 캘린더·카트·검색에
 *   전부 새어 나간다(기수 진열을 season-item 으로 뺀 것과 같은 이유). 정적 세그먼트는
 *   동적 라우트보다 우선하므로 이 주소만 이 페이지가 받는다.
 *
 * ⚠ **결제가 없다** — 선신청 후 운영자가 해당 번호로 직접 연락하는 구조다(카피 근거:
 *   "신청서를 작성해 주시면 해당 번호로 연락드리겠습니다"). 카탈로그·주문 원장과 무관.
 *
 * 슬러그 `dm-gd` 는 운영자 확정 (docs/url-policy.md §2 — 한 번 공개하면 바꾸지 않는다).
 *
 * ⚠ 카피는 운영자 소유 — 원문 그대로다. 강조 마크업(색)만 입혔고 한 글자도 고치지 않았다.
 */

export const metadata: Metadata = {
  title: "동민과 고든 커피앤바 — 레이지클럽",
  description: "레이지 클럽 운영자인 안동민, 천고든과 대화를 나누고 싶은 분들을 위한 자리입니다.",
}

const LOGO = "/linky-lounge/book-club/home-v3/nav-logo-circle.png"

/** 본문에서 되풀이되는 '동민과 고든 커피앤바' — 제목과 같은 색 배분 */
function BrandRun() {
  return (
    <>
      <span className={cb.kOrange}>동민과 고든</span> <span className={cb.kPlum}>커피</span>
      <span className={cb.kSage}>앤</span>
      <span className={cb.kPlum}>바</span>
    </>
  )
}

export default function CoffeeBarPage() {
  return (
    <WorkroomShell>
      <main className={styles.content}>
        {/* 색·서체 변수는 이 바깥 래퍼가 들고 있다 — 티커가 본문 열(.page) 밖으로
            나가야 전폭이 되는데, 변수가 .page 에만 있으면 티커가 상속받지 못한다 */}
        <div className={cb.root}>
          {/* **탑네비 바로 밑 전폭 스티키 티커**, 좌측 등속
              (운영자 2026-08-25: "동민과 고든 커피앤바 보다 위에 있어야해 /
               탑네비 바로밑에 좌우폭에 맞추어 스티키로", 레퍼런스 outstanding-co.kr
               상단 스티키 바의 **반대 방향**).
              ⚠ 문구는 **원본 포스터의 첫 줄(환영 인사) 그대로**다 — 한때 "안녕하세요.
              동민과 고든입니다."로 갈아끼웠던 것은 지시 오독이었다(2026-08-25 정정).
              그 인사말은 티커가 아니라 **제목 아래 본문 첫 줄**로 따로 들어간다. */}
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
              <span className={cb.titleTop}>동민과 고든</span>
              <span>
                <span className={cb.kPlum}>커피</span>
                <span className={cb.kSage}>앤</span>
                <span className={cb.kPlum}>바</span>
              </span>
            </h1>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={cb.logo} src={LOGO} alt="레이지 클럽" width={74} height={74} />
          </header>

          <div className={cb.intro}>
            {/* 제목 바로 밑 인사말 — 운영자 2026-08-25 추가 지시
                ("그 아래 첫 제목 밑에 안녕하세요 동민과고든 그거 문장 추가").
                '동민과 고든' 주황 서식 유지 */}
            <p>
              안녕하세요. <span className={cb.kOrange}>동민과 고든</span>입니다.
            </p>
            <p>
              <BrandRun />는 음료 및 주류 판매점이 아닙니다.
            </p>
            <p>레이지 클럽 운영자인 안동민, 천고든과 대화를 나누고 싶은 분들을 위한 자리입니다.</p>
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

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={cb.watermark} src={LOGO} alt="" aria-hidden="true" loading="lazy" decoding="async" />
          </section>

          <h2 className={`${cb.blockHead} ${cb.formHead}`}>
            [신청서]
            <span className={cb.blockNote}>(신청 가능 시간: 평일 19시 ~ 24시)</span>
          </h2>

          <CoffeeBarForm />
          </div>
        </div>
      </main>
    </WorkroomShell>
  )
}
