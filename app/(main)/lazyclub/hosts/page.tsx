import type { Metadata } from "next"
import { WorkroomShell } from "../Shell"
import { HostForm } from "./HostForm"
import styles from "../home.module.css"
import h from "./hosts.module.css"

/**
 * 모임장 안내 + 모임 기획서 접수 — **초안** (운영자 2026-09-03 "일단 안내페이지 초안 뽑아봐.
 * 신청하는 란을 만들어서 직접 작성하고 접수할 수 있게").
 *
 * 구조 (운영자 확정): 레이지클럽은 모임장이 자기 모임을 **직접 기획해 가져오고**, 레이지클럽과
 * **협의**해 확정한다. 페이는 어디에도 쓰지 않는다. 레퍼런스(트레바리·동행클럽)는 참고하지 않는다.
 * 기획서: docs/plans/2026-09-03-host-recruitment-page.md
 *
 * ⚠ **카피는 초안이다.** 인용 표시한 문단(브랜드 3문단 첫 문단 · 인터뷰 문장)은 운영자 원문
 *   그대로이고, 그 밖의 문장은 이 초안이 쓴 것이라 운영자 검토·교체 대상이다. 어미는 05 톤 규칙
 *   (합쇼체 평서 · 독자 직접 호명 없음 · 감탄 없음).
 * ⚠ 주소 `/hosts` 는 운영자 확정 전 가안 (url-policy §1). 확정 전엔 **noindex** — 내비·사이트맵·
 *   푸터 어디에도 링크하지 않는다. 승인 뒤 index 로 열고 진입점을 붙인다.
 * ⚠ 개인정보처리방침에 '모임장 기획서' 항목이 아직 없다 — 병합 전 방침 개정(계획서 §8 P0)이 먼저다.
 */

export const metadata: Metadata = {
  title: "모임장 — 레이지클럽",
  description: "레이지클럽에서 모임을 여는 사람을 찾습니다. 모임장이 직접 기획하고, 레이지클럽과 협의해 확정합니다.",
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
          {/* ── 리드 — 첫 문단은 브랜드 3문단 원문(docs/redesign/05-copy-elements.md) 그대로 ── */}
          <div className={h.lead}>
            <p>
              문학과 철학, 예술의 한가운데서, 쉽게 공감하는 대화보다 서로 다른 시선과 부딪히는 순간을
              기다리는 사람들이 모입니다. 무색무취한 이야기에 고개만 끄덕이지 않습니다. 서로의 시선이
              엇갈리는 순간, 고립되어 있던 내 관점이 타인의 시선에 부딪혀 언제든 깨질 수 있음을
              받아들이며 그 순간을 환대합니다.
            </p>
            {/* 초안 — 운영자 교체 대상 */}
            <p className={h.plain}>
              레이지클럽은 그 자리를 여는 사람을 찾습니다. 모임은 레이지클럽이 정해 두지 않습니다.
              모임장이 직접 기획하고, 레이지클럽과 협의해 확정합니다.
            </p>
          </div>

          {/* ── 직접 기획합니다 ── */}
          <section className={h.section}>
            <span className={h.sectionLabel}>직접 기획합니다</span>
            <div className={h.rows}>
              <div className={h.row}>
                <span className={h.rowKey}>무엇을</span>
                <p className={h.rowVal}>
                  함께 읽고 볼 것. 책, 영화, 음악, 전시. 문학과 철학, 예술의 범위 안에서 정합니다.
                </p>
              </div>
              <div className={h.row}>
                <span className={h.rowKey}>어떤 형식으로</span>
                <p className={h.rowVal}>원데이 토크, 4주 과정, 기수제. 새로운 형식의 제안도 받습니다.</p>
              </div>
              <div className={h.row}>
                <span className={h.rowKey}>한 회를 어떻게</span>
                <p className={h.rowVal}>대화를 시작하는 발제와 질문, 그리고 마무리.</p>
              </div>
              <div className={h.row}>
                <span className={h.rowKey}>어떤 자리인지</span>
                <p className={h.rowVal}>모임을 소개하는 글.</p>
              </div>
            </div>
          </section>

          {/* ── 함께 협의합니다 ── */}
          <section className={h.section}>
            <span className={h.sectionLabel}>함께 협의합니다</span>
            <div className={h.rows}>
              <div className={h.row}>
                <span className={h.rowNum}>01</span>
                <p className={h.rowVal}>
                  <span className={h.rowTitle}>기획서</span>
                  아래 접수란에 직접 작성합니다. 형식은 자유입니다.
                </p>
              </div>
              <div className={h.row}>
                <span className={h.rowNum}>02</span>
                <p className={h.rowVal}>
                  <span className={h.rowTitle}>협의</span>
                  링키라운지에서 마주 앉거나 전화로, 기획서를 놓고 형식과 일정, 정원을 맞춥니다.
                  멤버가 인터뷰를 지나듯 모임장은 협의를 지납니다. 서로의 결을 미리 엿보며, 우리의
                  대화가 앞으로 어떻게 얽혀 나갈지 함께 가늠해 보는 첫 출발점이 되어 줍니다.
                </p>
              </div>
              <div className={h.row}>
                <span className={h.rowNum}>03</span>
                <p className={h.rowVal}>
                  <span className={h.rowTitle}>개설</span>
                  모임 페이지가 열리고 홈과 일정에 놓입니다. 멤버 접수와 결제, 공간과 다과는
                  레이지클럽이 맡습니다.
                </p>
              </div>
            </div>
          </section>

          {/* ── 레이지클럽이 맡는 것 ── */}
          <section className={h.section}>
            <span className={h.sectionLabel}>레이지클럽이 맡는 것</span>
            <div className={h.rows}>
              <div className={h.row}>
                <span className={h.rowKey}>공간</span>
                <p className={h.rowVal}>링키라운지. 사당역 10번 출구 도보 3분.</p>
              </div>
              <div className={h.row}>
                <span className={h.rowKey}>접수와 결제</span>
                <p className={h.rowVal}>멤버 접수와 인터뷰, 결제와 안내.</p>
              </div>
              <div className={h.row}>
                <span className={h.rowKey}>자리</span>
                <p className={h.rowVal}>홈과 모임 목록, 일정, 사람 페이지에 모임과 모임장을 소개합니다.</p>
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
