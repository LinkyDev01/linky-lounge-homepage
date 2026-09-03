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
 * 4차 (운영자 "현재 문체가 구리고, 클로드 특유의 딱딱하고 간결한 문장과 단어 구성이 거슬려. 레이지데이
 *   북클럽은 언급만하고 소개 안할거야. 책과 영화얘기 더 빼"):
 *   짧게 끊어 단정하는 문장("정해진 양식은 없습니다. 아래 네 가지가 담겨 있으면 충분합니다.")을 버리고,
 *   운영자 원고(4주 과정 인사말·시지프 설명)처럼 **길게 이어지다 초대로 맺히는 호흡**으로 다시 썼다 —
 *   "~어도 좋습니다", "~해 보시면 됩니다", "~에 여러분을 초대합니다"의 결. 북클럽은 이름만 한 번 스치고
 *   소개하지 않는다. 책·영화라는 소재 언급은 페이지·폼에서 전부 뺐다(모임의 소재를 정해 두지 않는다).
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
 * **운영자 승인 (2026-09-03 "승인할게")** — 4차 초안을 그대로 실사이트로. 주소 `/hosts` 확정, 색인은
 * 레이지클럽 레이아웃의 호스트 판정(lazy-club.com 만 index)을 따르므로 페이지 단위 noindex 를 걷었다.
 * 방침 개정(제1조 5호·제2조 6호·제3조 5호 '모임장 기획서')이 같은 PR 에 있다 — 기능보다 방침이 먼저.
 * 진입 링크(내비·푸터·사람 페이지)는 별도 결정 — 이 PR 은 페이지·접수·색인까지.
 */

export const metadata: Metadata = {
  title: "모임장 — 레이지클럽",
  description: "레이지클럽에서 함께 모임을 열어 갈 분을 찾습니다. 모임장이 직접 기획하고, 레이지클럽이 곁에서 함께 준비합니다.",
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
          <h1 className={h.headline}>함께 모임을 열어 갈 분을 찾습니다.</h1>
          <p className={h.brandLine}>
            저마다 다른 삶의 궤적 속 불협화음이 예술의 본질을 관통하여 하나의 선율이 되는 순간을
            소망합니다.
          </p>
          <p className={h.para}>
            레이지클럽에는 레이지데이 북클럽을 비롯해, 저마다의 이야기를 가진 사람들이 한자리에 모여 앉는
            모임들이 열립니다. 그 자리를 여는 것은 레이지클럽이 아니라 모임장입니다. 어떤 이야기를 나눌지,
            어떤 사람들과 어떤 시간을 만들어 갈지는 모임장이 먼저 그려 오고, 레이지클럽은 그 그림이 실제
            모임이 되기까지 곁에서 함께 준비합니다.
          </p>
          <p className={h.para}>
            거창한 기획이 아니어도 좋습니다. 마음에 두고 있던 이야기 하나면, 그것으로 충분한 시작입니다.
          </p>

          {/* ── 모임장이 그려 오는 것 ── */}
          <section className={h.section}>
            <h2 className={h.sectionTitle}>모임장이 그려 오는 것</h2>
            <p className={h.para}>
              기획서라고 해서 정해진 양식이 있는 것은 아닙니다. 다만 아래의 이야기들이 담겨 있다면, 처음
              만나 나누는 대화가 한결 수월해집니다.
            </p>
            <div className={h.items}>
              <div className={h.item}>
                <span className={h.itemTitle}>어떤 이야기를 나누고 싶은지</span>
                <p className={h.itemBody}>
                  모임의 중심이 되는 이야기입니다. 무엇을 두고 어떤 이야기를 나누고 싶은지, 떠오르는 대로
                  자유롭게 적어 주시면 됩니다.
                </p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>어떤 방식으로 만나고 싶은지</span>
                <p className={h.itemBody}>
                  하루 동안 만나는 원데이 토크가 될 수도, 몇 주에 걸쳐 이어지는 과정이 될 수도 있습니다.
                  아직 정하지 못했다면 그대로 두셔도 괜찮습니다. 함께 이야기하며 맞춰 갑니다.
                </p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>한 번의 모임을 어떻게 이끌어 갈지</span>
                <p className={h.itemBody}>
                  모임을 어떻게 열고, 어떤 흐름으로 이야기를 이어 가고, 어떻게 마무리하고 싶은지를 떠올려
                  보시면 됩니다. 발제문이나 질문을 미리 준비하는 것도 좋고, 그 자리의 흐름에 맡기고 싶다면
                  그것도 하나의 방식입니다.
                </p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>모임을 소개하는 글</span>
                <p className={h.itemBody}>
                  함께할 사람들에게 건네는 짧은 소개입니다. 몇 문장이어도 좋습니다.
                </p>
              </div>
            </div>
          </section>

          {/* ── 레이지클럽과 함께 준비하는 것 ── */}
          <section className={h.section}>
            <h2 className={h.sectionTitle}>레이지클럽과 함께 준비하는 것</h2>
            <p className={h.para}>
              기획서를 보내 주시면, 링키라운지에서 직접 만나거나 전화로 이야기를 나눕니다. 심사를 위한
              자리는 아닙니다. 어떤 모임이 될지 함께 그려 보고, 형식과 일정, 정원처럼 정해야 할 것들을
              하나씩 맞춰 가는 시간입니다.
            </p>
            <div className={h.items}>
              <div className={h.item}>
                <span className={h.itemTitle}>
                  <span className={h.stepNum}>01</span>기획서
                </span>
                <p className={h.itemBody}>이 페이지 아래에서 바로 작성해 보내실 수 있습니다.</p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>
                  <span className={h.stepNum}>02</span>이야기
                </span>
                <p className={h.itemBody}>
                  링키라운지에서 만나거나 전화로 이야기를 나누며, 형식과 일정, 정원을 함께 정합니다.
                </p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>
                  <span className={h.stepNum}>03</span>개설
                </span>
                <p className={h.itemBody}>
                  모임 페이지가 만들어지고 홈과 일정에 소개됩니다. 멤버를 모으고 맞이하는 일은 그때부터
                  레이지클럽이 맡습니다.
                </p>
              </div>
            </div>
          </section>

          {/* ── 레이지클럽이 맡는 것 ── */}
          <section className={h.section}>
            <h2 className={h.sectionTitle}>레이지클럽이 맡는 것</h2>
            <p className={h.para}>
              모임장이 모임 그 자체에만 마음을 쓸 수 있도록, 그 밖의 일들은 레이지클럽이 준비합니다.
            </p>
            <div className={h.items}>
              <div className={h.item}>
                <span className={h.itemTitle}>공간</span>
                <p className={h.itemBody}>
                  모임은 사당역 10번 출구에서 걸어서 3분 거리의 링키라운지에서 열립니다. 다과도 함께
                  준비합니다.
                </p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>멤버</span>
                <p className={h.itemBody}>멤버 모집과 접수, 인터뷰, 결제와 안내까지 레이지클럽이 진행합니다.</p>
              </div>
              <div className={h.item}>
                <span className={h.itemTitle}>자리</span>
                <p className={h.itemBody}>홈과 모임 목록, 일정, 그리고 사람 페이지에 모임과 모임장을 소개합니다.</p>
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
