import type { Metadata } from "next"
import { WorkroomShell } from "../Shell"
import { HostForm } from "./HostForm"
import styles from "../home.module.css"
import h from "./hosts.module.css"

/**
 * 모임장 안내 + 모임 기획서 접수 — **초안 2차** (운영자 2026-09-03).
 *
 * 구조 (운영자 확정): 레이지클럽은 모임장이 자기 모임을 **직접 기획해 가져오고**, 레이지클럽과
 * **협의**해 확정한다. 페이는 어디에도 쓰지 않는다. 레퍼런스(트레바리·동행클럽)는 참고하지 않는다.
 * 기획서: docs/plans/2026-09-03-host-recruitment-page.md
 *
 * 3차 (운영자 "잘못 레퍼런스를 참조한 것 같은데 우리는 '오래 붙든다'는 표현도 쓰지 않고 하지도 않아"):
 *   카피의 재료를 **레이지클럽 트리에 실제로 있는 마케팅 문구**로 한정했다 — 브랜드 문장, 원데이 토크
 *   설명("함께 보고 이야기 나누는", "솔직한 이야기를 나눕니다", "여러분을 초대합니다"), 홈 도록체
 *   캡션("한 편의 발제문에서 시작되는 북토크", "이야기가 무르익는 곳, 링키라운지"), 랜딩 키워드
 *   (원데이 토크·북토크·소셜클럽·영화 모임), booktalk 리드("한 권의 책으로 밀도 있는 시간을 나눕니다").
 *   새 은유·새 어휘를 만들지 않는다. 북클럽과의 차이는 사실 한 문장(기수제·철학과 고전 vs 책 한 권·
 *   영화 한 편으로 하루 만나는 모임부터)으로만 말한다 — "클럽은 무겁게만 가지 않고 4권의 책이란 틀도 없다".
 *
 * 2차에서 바꾼 것 (운영자 피드백 3건):
 *   ① 가독성 — 위계(제목 24/18px)·본문 14.5px·세로 적층 항목 (hosts.module.css 머리 주석)
 *   ② **'문학과 철학'은 레이지데이 북클럽의 범위다** — 레이지클럽 페이지에서 그 문구와 북클럽 브랜드
 *      3문단 인용을 전부 걷어냈다. 레이지클럽 고유 원문은 브랜드 문장 하나("…예술의 본질을 관통하여…")
 *      뿐이라 그것만 인용한다.
 *   ③ 문체 — 명사구 조각을 버리고 운영자 원고처럼 **완결된 문장이 흐르는** 합쇼체로. 기계 번역투
 *      ("~합니다. ~입니다." 단문 나열, "형식은 자유입니다"식 규정문)를 피했다.
 *
 * ⚠ **카피는 여전히 초안이다.** 브랜드 문장 한 줄만 원문이고 나머지는 운영자 교체 대상.
 * ⚠ 주소 `/hosts` 는 가안. 확정 전엔 noindex — 내비·사이트맵·푸터 어디에도 링크하지 않는다.
 * ⚠ 개인정보처리방침에 '모임장 기획서' 항목이 아직 없다 — 병합 전 방침 개정이 먼저다.
 */

export const metadata: Metadata = {
  title: "모임장 — 레이지클럽",
  description: "레이지클럽에서 모임을 여는 사람을 찾습니다. 모임장이 직접 기획하고, 레이지클럽과 함께 준비합니다.",
  robots: { index: false, follow: false },
}

export default function HostsPage() {
  return (
    <WorkroomShell>
      <main className={styles.content}>
        <div className={styles.indexHead}>
          <div className={styles.sectionTitle}>
            <span>
              <span>모임장</span>
            </span>
          </div>
        </div>

        <div className={h.wrap}>
          {/* ── 머리 — 브랜드 문장은 레이지클럽 푸터 원문(운영자 2026-08-04) 그대로 ── */}
          <h1 className={h.headline}>모임을 여는 사람을 찾습니다.</h1>
          <p className={h.brandLine}>
            저마다 다른 삶의 궤적 속 불협화음이 예술의 본질을 관통하여 하나의 선율이 되는 순간을
            소망합니다.
          </p>
          <p className={h.para}>
            레이지클럽에서는 한 권의 책, 한 편의 영화로 함께 보고 이야기 나누는 모임이 열립니다. 레이지데이
            북클럽이 한 기수 동안 철학과 고전을 함께 읽는 자리라면, 레이지클럽에는 하루 만나는 원데이 토크부터
            4주 과정까지 여러 모임이 자리합니다.
          </p>
          <p className={h.para}>
            어떤 모임을 열지는 정해 두지 않았습니다. 모임장이 직접 기획해 가져오고, 레이지클럽과 이야기를
            나누며 함께 준비합니다.
          </p>

          {/* ── 모임장이 기획하는 것 ── */}
          <section className={h.section}>
            <h2 className={h.sectionTitle}>모임장이 기획하는 것</h2>
            <p className={h.para}>
              정해진 양식은 없습니다. 아래 네 가지가 담겨 있으면 충분합니다.
            </p>
            <div className={h.items}>
              <div className={h.item}>
                <span className={h.itemTitle}>함께 보고 이야기 나눌 것</span>
                <p className={h.itemBody}>한 권의 책, 한 편의 영화처럼 함께 보고 이야기 나눌 것을 정합니다.</p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>모임의 형식</span>
                <p className={h.itemBody}>
                  하루 만나는 원데이 토크, 4주 과정, 정기 모임. 어느 쪽이어도 좋고, 새로운 형식도 좋습니다.
                </p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>한 회의 흐름</span>
                <p className={h.itemBody}>
                  발제문으로 시작해도 좋고, 영화를 함께 본 뒤 이야기를 나눠도 좋습니다. 한 회를 어떻게
                  열고 마무리할지를 적습니다.
                </p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>모임을 소개하는 글</span>
                <p className={h.itemBody}>
                  함께할 사람들에게 건네는 소개입니다. 몇 문장이면 충분합니다.
                </p>
              </div>
            </div>
          </section>

          {/* ── 레이지클럽과 함께 다듬는 것 ── */}
          <section className={h.section}>
            <h2 className={h.sectionTitle}>레이지클럽과 함께 준비하는 것</h2>
            <p className={h.para}>
              기획서가 오면 링키라운지에서 만나거나 전화로 이야기를 나눕니다. 형식과 일정, 정원을 함께
              정하고 첫 모임을 준비합니다.
            </p>
            <div className={h.items}>
              <div className={h.item}>
                <span className={h.itemTitle}>
                  <span className={h.stepNum}>01</span>기획서
                </span>
                <p className={h.itemBody}>이 페이지 아래에서 바로 쓸 수 있습니다.</p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>
                  <span className={h.stepNum}>02</span>이야기
                </span>
                <p className={h.itemBody}>
                  링키라운지에서 만나거나 전화로 이야기를 나눕니다. 형식과 일정, 정원을 함께 정합니다.
                </p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>
                  <span className={h.stepNum}>03</span>개설
                </span>
                <p className={h.itemBody}>
                  모임 페이지가 열리고 홈과 일정에 올라갑니다. 멤버 접수부터는 레이지클럽이 맡습니다.
                </p>
              </div>
            </div>
          </section>

          {/* ── 레이지클럽이 맡는 것 ── */}
          <section className={h.section}>
            <h2 className={h.sectionTitle}>레이지클럽이 맡는 것</h2>
            <p className={h.para}>모임장은 모임에만 집중할 수 있도록, 그 밖의 일은 레이지클럽이 맡습니다.</p>
            <div className={h.items}>
              <div className={h.item}>
                <span className={h.itemTitle}>공간</span>
                <p className={h.itemBody}>
                  사당역 10번 출구에서 걸어서 3분, 링키라운지에서 모입니다. 다과를 준비합니다.
                </p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>멤버</span>
                <p className={h.itemBody}>멤버 접수와 인터뷰, 결제와 안내를 진행합니다.</p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>자리</span>
                <p className={h.itemBody}>홈과 모임 목록, 일정, 사람 페이지에 모임과 모임장을 소개합니다.</p>
              </div>
            </div>
          </section>

          {/* ── 접수란 ── */}
          <HostForm />
        </div>
      </main>
    </WorkroomShell>
  )
}
