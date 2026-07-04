"use client"

import { useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { LazydayLink } from "@/components/common/LazydayLink"
import styles from "./page.module.css"

/**
 * 이용약관 및 환불 규정 — 탭 구성 (운영자 지시 2026-07-04, 개정 2026-07-04).
 * 약관 원문은 운영자 확정 원고 기준. 원고 대비 반영 사항:
 *  · 제5조 ④~⑥ 신설: 요일 모임 구조 정의, 2명 이하 요일 취소 가능
 *    + 마지막 요일 모임(일요일)은 인원 무관 진행, 적정 인원 초과 시 선착순 제한
 *  · 환불 기산은 '시작주'(주 단위)가 아니라 **회차 시작일/종료일**(날짜 단위) 기준으로
 *    개정 — 제2조에 시작일·종료일 정의 신설, 제10·11조 표현 전체 교체
 *  · 제11조 사전참여 고지 조항 삭제 — 결제 시 안내로 갈음 (운영자 판단)
 * 요약·의역 없이 조문 원문만 게재 — 정식 문서 톤 유지, 페이드·아코디언 등 마케팅
 * 문법 사용 금지. 두 탭 모두 약관 조문 표시, 환불 규정 탭은 제3장 발췌.
 */

type Tab = "terms" | "refund"

// ── 약관 조문 렌더 헬퍼 ─────────────────────────────────────
function Article({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.article}>
      <h3 className={styles.articleTitle}>{title}</h3>
      {children}
    </div>
  )
}

// ── 제3장 (계약해지 및 환불) — 두 탭이 공유하는 원문 ────────
function RefundArticles() {
  return (
    <>
      <Article title="제9조 (청약철회)">
        <ol className={styles.clauseList}>
          <li>회원은 참가비를 결제한 날부터 7일 이내에는 위약금이나 수수료 없이 청약철회를 할 수 있다. 이 경우 아직 제공되지 않은 회차분의 참가비는 전액 환불한다.</li>
          <li>제1항의 기간 중이라도 이미 참석을 완료한 회차가 있는 경우, 북클럽은 그 회차의 공급에 실제로 든 비용에 상당하는 금액을 공제한 나머지를 환불할 수 있다.</li>
          <li>제10조 및 제11조는 제1항의 기간이 지난 이후에 적용한다.</li>
        </ol>
      </Article>

      <Article title="제10조 (환불 기준)">
        <ol className={styles.clauseList}>
          <li>
            제9조 제1항의 기간이 지난 이후의 환불은 다음 각 호에 따른다.
            <ol className={styles.itemList}>
              <li>정규 1회차 시작일 전까지 취소하는 경우, 참가비 총액의 60퍼센트를 환불한다.</li>
              <li>정규 1회차 종료일이 지난 후부터 정규 2회차 시작일 전까지 취소하는 경우, 참가비 총액의 40퍼센트를 환불한다.</li>
              <li>정규 2회차 종료일이 지난 후부터 정규 3회차 시작일 전까지 취소하는 경우, 참가비 총액의 20퍼센트를 환불한다.</li>
              <li>정규 3회차 종료일이 지난 후부터는 정규 4회차 및 자유 독서모임을 포함하여 환불하지 않는다.</li>
            </ol>
          </li>
          <li>환불률은 회원이 실제로 환불을 신청한 시점을 기준으로 적용한다. 별도 신청 없이 특정 회차에 불참한 경우는 환불 신청으로 보지 않는다.</li>
        </ol>
      </Article>

      <Article title="제11조 (사전참여자에 대한 특칙)">
        <ol className={styles.clauseList}>
          <li>사전참여를 신청하여 직전 기수의 자유 독서모임에 참석한 회원은 그 자유 독서모임의 시작일을 제2조 제9항의 기산일로 본다.</li>
          <li>사전참여로 참석한 자유 독서모임의 종료일이 지난 후부터 정규 1회차 시작일 전까지 취소하는 경우, 참가비 총액의 40퍼센트를 환불한다. 이후 정규 1회차 종료일이 지난 후부터는 제10조 제1항 제3호를, 정규 2회차 종료일이 지난 후부터는 같은 항 제4호를 순서대로 적용한다.</li>
        </ol>
      </Article>

      <Article title="제12조 (북클럽 귀책사유로 인한 환불)">
        <p className={styles.clause}>
          진행자 사정에 의한 회차 취소 또는 연기 등 북클럽의 귀책사유로 회원이 정규 독서모임 또는 자유 독서모임을 정상적으로 제공받지 못한 경우,
          제10조 및 제11조와 관계없이 해당 회차에 상당하는 금액을 전액 환불하거나 다음 기수로 이월한다.
        </p>
      </Article>

      <Article title="제13조 (환불 신청 및 처리)">
        <ol className={styles.clauseList}>
          <li>환불 신청은 북클럽이 안내하는 연락처로 문자 또는 카카오톡을 통해 접수한다.</li>
          <li>환불은 접수일로부터 영업일 기준 5일 이내에 처리한다.</li>
          <li>이 약관에 따라 산정된 금액 외에 별도의 위약금이나 수수료는 청구하지 않는다.</li>
        </ol>
      </Article>

      <Article title="제14조 (환불과 참석의 구분)">
        <ol className={styles.clauseList}>
          <li>이 약관에 따라 환불이 제한되거나 불가능해진 경우에도 회원의 남은 회차에 대한 참석 자격은 유지된다.</li>
          <li>특정 회차에 대한 결석은 이 약관이 아니라 북클럽이 별도로 정하는 출석 기준에 따른다.</li>
        </ol>
      </Article>
    </>
  )
}

// ── 이용약관 전문 ───────────────────────────────────────────
function TermsContent() {
  return (
    <>
      <h2 className={styles.chapterTitle}>제1장 총칙</h2>

      <Article title="제1조 (목적)">
        <p className={styles.clause}>
          이 약관은 주식회사 링키(이하 &ldquo;회사&rdquo;라 한다)가 운영하는 레이지데이 북클럽(이하 &ldquo;북클럽&rdquo;이라 한다)의
          이용조건 및 절차, 회사와 회원 간의 권리와 의무, 책임사항을 정하는 것을 목적으로 한다.
        </p>
      </Article>

      <Article title="제2조 (정의)">
        <ol className={styles.clauseList}>
          <li>&ldquo;북클럽&rdquo;이란 회사가 운영하는 기수제 독서모임 서비스인 레이지데이 북클럽을 말한다.</li>
          <li>&ldquo;회원&rdquo;이란 북클럽의 이용을 신청하고 회사가 이를 승낙하여 북클럽을 이용하는 자를 말한다.</li>
          <li>&ldquo;기수&rdquo;란 정규 독서모임 4회와 자유 독서모임 1회를 합쳐 총 5회로 구성되는 하나의 참가 단위를 말한다.</li>
          <li>&ldquo;정규 독서모임&rdquo;이란 기수의 1회차부터 4회차까지 진행되는 모임을 말한다.</li>
          <li>&ldquo;자유 독서모임&rdquo;이란 기수의 5회차에 해당하는 모임을 말한다.</li>
          <li>&ldquo;사전참여&rdquo;란 회원이 본인이 배정된 기수가 시작되기 전, 직전 기수의 자유 독서모임에 미리 참석하는 것을 말한다.</li>
          <li>각 회차의 &ldquo;시작일&rdquo;이란 해당 회차가 진행되는 날 중 가장 이른 날을 말한다.</li>
          <li>각 회차의 &ldquo;종료일&rdquo;이란 해당 회차가 진행되는 날 중 가장 늦은 날을 말한다.</li>
          <li>제10조의 환불 기준을 적용하는 기산일은 정규 1회차의 시작일로 한다. 다만 제11조가 적용되는 경우에는 그에 따른다.</li>
        </ol>
      </Article>

      <Article title="제3조 (약관의 효력 및 변경)">
        <ol className={styles.clauseList}>
          <li>이 약관은 북클럽의 신청 페이지 또는 회사가 정하는 방법으로 게시함으로써 효력이 발생한다.</li>
          <li>회사는 관계 법령을 위반하지 않는 범위에서 이 약관을 개정할 수 있다. 약관을 개정하는 경우 적용일자와 개정 사유를 명시하여 적용일자 7일 전부터 게시한다. 다만 회원에게 불리하게 개정하는 경우에는 적용일자 30일 전부터 게시한다.</li>
          <li>회원이 개정된 약관의 적용일 이후에도 북클럽을 계속 이용하는 경우, 개정된 약관에 동의한 것으로 본다.</li>
        </ol>
      </Article>

      <Article title="제4조 (약관 외 준칙)">
        <p className={styles.clause}>
          이 약관에서 정하지 않은 사항은 관계 법령 및 회사가 별도로 정하는 개별 안내(모임 규칙, 신청 안내 등)에 따른다.
        </p>
      </Article>

      <h2 className={styles.chapterTitle}>제2장 서비스 및 이용계약</h2>

      <Article title="제5조 (서비스의 내용)">
        <ol className={styles.clauseList}>
          <li>북클럽은 기수 단위로 운영되며, 하나의 기수는 정규 독서모임 4회와 자유 독서모임 1회로 구성된다.</li>
          <li>회사는 회원 간 대화의 질을 유지하기 위해 인터뷰를 거쳐 회원을 모집하고, 인터뷰 내용과 희망 일정을 반영하여 반을 배정한다.</li>
          <li>회사는 신규 회원이 본인의 기수가 시작되기 전 직전 기수의 자유 독서모임에 사전참여할 수 있는 절차를 운영할 수 있다.</li>
          <li>정규 독서모임의 각 회차는 복수의 요일 모임으로 나뉘어 진행될 수 있으며, 회원은 그중 하나를 선택하여 참석한다.</li>
          <li>특정 요일 모임의 참가 인원이 2명 이하인 경우, 회사는 해당 요일 모임의 진행을 취소하고 회원에게 같은 회차의 다른 요일 모임 참석을 안내할 수 있다. 다만 각 회차의 마지막 요일 모임(일요일)은 참가 인원과 관계없이 진행한다. 회원이 같은 회차의 다른 요일 모임에 참석할 수 없는 경우에는 제12조를 준용한다.</li>
          <li>회사는 특정 모임의 참가 신청 인원이 원활한 대화를 위한 적정 인원을 초과한다고 판단하는 경우, 선착순으로 참석 인원을 제한할 수 있다.</li>
        </ol>
      </Article>

      <Article title="제6조 (이용계약의 성립)">
        <ol className={styles.clauseList}>
          <li>이용계약은 이용희망자가 인터뷰에 참여하고, 회사가 반 배정을 확정하며, 이용희망자가 참가비를 결제함으로써 성립한다.</li>
          <li>회사는 정원 초과, 인터뷰 결과 부적합 판정 등 합리적인 사유가 있는 경우 이용신청의 승낙을 유보하거나 거절할 수 있다.</li>
        </ol>
      </Article>

      <Article title="제7조 (회원의 의무)">
        <ol className={styles.clauseList}>
          <li>회원은 북클럽이 별도로 안내하는 모임 규칙을 준수하여야 한다.</li>
          <li>회원은 참가비를 정해진 기한 내에 결제하여야 하며, 본인의 이용권을 타인에게 양도하거나 대여할 수 없다.</li>
          <li>회원은 모임 중 알게 된 다른 회원의 개인정보 및 발언 내용을 본인의 동의 없이 외부에 공개하거나 모임 목적 외로 사용해서는 안 된다.</li>
        </ol>
      </Article>

      <Article title="제8조 (회사의 의무)">
        <ol className={styles.clauseList}>
          <li>회사는 북클럽을 안정적으로 운영하기 위해 노력하며, 진행자 사정으로 모임 진행이 어려운 경우 이를 사전에 회원에게 안내한다.</li>
          <li>회사는 회원의 개인정보를 관계 법령에 따라 보호한다.</li>
        </ol>
      </Article>

      <h2 className={styles.chapterTitle}>제3장 계약해지 및 환불</h2>
      <RefundArticles />

      <h2 className={styles.chapterTitle}>제4장 기타</h2>

      <Article title="제15조 (이용제한 및 자격상실)">
        <ol className={styles.clauseList}>
          <li>회사는 회원이 제7조의 의무를 반복적으로 위반하거나 다른 회원에게 피해를 주는 행위를 하는 경우, 해당 회원의 남은 회차 참석을 제한하거나 자격을 상실시킬 수 있다.</li>
          <li>제1항에 따라 이용이 제한되는 경우, 환불 여부 및 범위는 제10조부터 제12조까지의 기준을 준용하여 정한다.</li>
        </ol>
      </Article>

      <Article title="제16조 (개인정보의 보호)">
        <p className={styles.clause}>
          회사는 회원의 개인정보를 관계 법령 및 회사가 별도로 게시하는 개인정보처리방침에 따라 수집, 이용, 보관한다.
        </p>
      </Article>

      <Article title="제17조 (손해배상 및 면책)">
        <ol className={styles.clauseList}>
          <li>회사는 천재지변, 그 밖의 불가항력적 사유로 서비스를 제공할 수 없는 경우 그 책임을 지지 않는다.</li>
          <li>회사는 회원 간에 발생한 분쟁에 대해 고의 또는 중대한 과실이 없는 한 책임을 지지 않는다.</li>
        </ol>
      </Article>

      <Article title="제18조 (분쟁해결 및 관할법원)">
        <ol className={styles.clauseList}>
          <li>회사와 회원은 북클럽 이용과 관련하여 발생한 분쟁을 원만하게 해결하기 위해 성실히 협의한다.</li>
          <li>협의에도 불구하고 분쟁이 해결되지 않는 경우, 민사소송법상의 관할법원에 소를 제기할 수 있다.</li>
        </ol>
      </Article>

      <h2 className={styles.chapterTitle}>부칙</h2>
      <Article title="제1조 (시행일)">
        <p className={styles.clause}>이 약관은 2026년 6월 15일부터 시행한다.</p>
      </Article>
    </>
  )
}

// ── 환불 규정 탭 (약관 제3장 발췌) ──────────────────────────
function RefundContent() {
  return (
    <section className={styles.section}>
      <h2 className={styles.chapterTitle}>제3장 계약해지 및 환불</h2>
      <RefundArticles />
      <p className={styles.clause}>이 약관은 2026년 6월 15일부터 시행한다.</p>
    </section>
  )
}

export function PolicyTabs() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const initial: Tab = searchParams.get("tab") === "refund" ? "refund" : "terms"
  const [tab, setTab] = useState<Tab>(initial)

  const switchTab = (t: Tab) => {
    setTab(t)
    router.replace(`${pathname}?tab=${t}`, { scroll: false })
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <LazydayLink href="/" className={styles.backLink}>← 레이지데이 북클럽 홈</LazydayLink>

        <div className={styles.titleRow}>
          <h1 className={styles.pageTitle}>이용약관 및 환불 규정</h1>
        </div>

        <div className={styles.tabSeg} role="tablist" aria-label="문서 선택">
          <button
            role="tab"
            aria-selected={tab === "terms"}
            className={`${styles.tabBtn} ${tab === "terms" ? styles.tabBtnActive : ""}`}
            onClick={() => switchTab("terms")}
          >
            이용약관
          </button>
          <button
            role="tab"
            aria-selected={tab === "refund"}
            className={`${styles.tabBtn} ${tab === "refund" ? styles.tabBtnActive : ""}`}
            onClick={() => switchTab("refund")}
          >
            환불 규정
          </button>
        </div>

        {tab === "terms" ? <TermsContent /> : <RefundContent />}

        <div className={styles.contact}>
          <p className={styles.contactText}>문의</p>
          <a
            href="https://www.instagram.com/lazyday_bookclub"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.contactLink}
          >
            인스타그램(@lazyday_bookclub) 다이렉트 메시지로 접수한다.
          </a>
        </div>
      </div>
    </main>
  )
}
