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
  description: "레이지클럽에서 모임을 여는 사람을 찾습니다. 모임장이 직접 기획하고, 레이지클럽과 함께 다듬어 엽니다.",
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
            그 순간이 열리는 자리를 함께 만들 사람을 찾고 있습니다. 어떤 모임을 열지는 레이지클럽이
            정해 두지 않습니다. 오래 붙들어 온 작품과 화두를 가진 사람이 스스로 모임을 기획하고,
            레이지클럽과 마주 앉아 함께 다듬어 나갑니다.
          </p>

          {/* ── 모임장이 기획하는 것 ── */}
          <section className={h.section}>
            <h2 className={h.sectionTitle}>모임장이 기획하는 것</h2>
            <p className={h.para}>
              기획서에 담기는 것은 크게 넷입니다. 정해진 양식은 없고, 아래 네 가지가 읽히는 글이면
              충분합니다.
            </p>
            <div className={h.items}>
              <div className={h.item}>
                <span className={h.itemTitle}>함께 읽고 보는 것</span>
                <p className={h.itemBody}>
                  책이든 영화든 음악이든, 한 사람이 오래 붙들어 온 작품과 그 안에서 건져 올린 화두입니다.
                </p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>모임의 형식</span>
                <p className={h.itemBody}>
                  하루에 끝나는 원데이 토크, 4주에 걸치는 과정, 한 기수를 함께 지나는 모임. 어느 쪽이든
                  좋고, 새로운 형식을 제안해도 됩니다.
                </p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>한 회의 흐름</span>
                <p className={h.itemBody}>
                  대화를 무엇으로 열고, 어떤 질문을 건네고, 어떻게 마무리할지를 그려 봅니다.
                </p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>모임을 소개하는 글</span>
                <p className={h.itemBody}>
                  그 자리에 앉은 사람들이 어떤 시간을 보내게 될지가 그려지는 글이면 좋습니다.
                </p>
              </div>
            </div>
          </section>

          {/* ── 레이지클럽과 함께 다듬는 것 ── */}
          <section className={h.section}>
            <h2 className={h.sectionTitle}>레이지클럽과 함께 다듬는 것</h2>
            <p className={h.para}>
              기획서가 도착하면 링키라운지에서 마주 앉거나 전화로 이야기를 나눕니다. 심사라기보다,
              같은 자리에 앉아 이 모임이 어떤 모양이 될지 함께 그려 보는 시간에 가깝습니다.
            </p>
            <div className={h.items}>
              <div className={h.item}>
                <span className={h.itemTitle}>
                  <span className={h.stepNum}>01</span>기획서
                </span>
                <p className={h.itemBody}>이 페이지 아래에서 바로 씁니다. 정해진 양식은 없습니다.</p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>
                  <span className={h.stepNum}>02</span>협의
                </span>
                <p className={h.itemBody}>
                  기획서를 놓고 형식과 일정, 정원을 함께 정합니다. 이야기가 오가는 동안 기획이 처음과
                  달라지기도 합니다.
                </p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>
                  <span className={h.stepNum}>03</span>개설
                </span>
                <p className={h.itemBody}>
                  모임 페이지가 열리고, 홈과 일정에 자리가 잡힙니다. 그다음부터 멤버를 맞는 일은
                  레이지클럽이 맡습니다.
                </p>
              </div>
            </div>
          </section>

          {/* ── 레이지클럽이 맡는 것 ── */}
          <section className={h.section}>
            <h2 className={h.sectionTitle}>레이지클럽이 맡는 것</h2>
            <p className={h.para}>모임장이 대화에만 마음을 쓸 수 있도록, 그 바깥의 일은 레이지클럽이 맡습니다.</p>
            <div className={h.items}>
              <div className={h.item}>
                <span className={h.itemTitle}>공간</span>
                <p className={h.itemBody}>
                  사당역 10번 출구에서 걸어서 3분, 링키라운지에서 모입니다. 다과도 준비되어 있습니다.
                </p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>멤버</span>
                <p className={h.itemBody}>접수와 인터뷰, 결제와 안내를 레이지클럽이 진행합니다.</p>
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
