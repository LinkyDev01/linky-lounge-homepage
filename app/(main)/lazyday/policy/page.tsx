import type { Metadata } from "next"
import { LazydayLink } from "@/components/common/LazydayLink"
import { SEASON } from "../season-config"
import styles from "./page.module.css"

export const metadata: Metadata = {
  title: "참가 및 환불 안내 · 레이지데이 북클럽",
  description: "레이지데이 북클럽의 신청·참가 확정·환불 기준 안내",
}

/**
 * 참가 및 환불 안내 — 레이지데이 북클럽 단일 모임 기준.
 * 기존 linkylounge /policy(4개 탭)의 북클럽 정책을 승계하되,
 * 현 사이트 톤앤매너(팔레트·타이포·경어체)로 재작성 (운영자 지시 2026-07-04).
 * ⚠️ 환불 기준 수치·문구는 운영자 검토 후 배포.
 */
export default function LazydayPolicyPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <LazydayLink href="/" className={styles.backLink}>← 레이지데이 북클럽 홈</LazydayLink>

        <div className={styles.titleRow}>
          <h1 className={styles.pageTitle}>참가 및 환불 안내</h1>
        </div>
        <p className={styles.lead}>
          레이지데이 북클럽의 신청부터 참가 확정, 환불까지의 기준을 안내드려요.
          신청 전에 한 번 읽어두시면 좋아요.
        </p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>신청과 <strong>참가 확정</strong></h2>
          <ul className={styles.list}>
            <li>신청 폼 작성 후, <strong>서면 또는 전화 인터뷰</strong>를 통해 서로의 결을 확인해요.</li>
            <li>인터뷰 결과는 개별 안내드리며, 참가가 확정되면 결제 안내를 드려요. 결제가 확인되면 참가가 최종 확정됩니다.</li>
            <li>참가 확정 후 카카오톡 단체방을 통해 상세 일정과 공지사항을 안내드려요.</li>
            <li>요일별 소수 정원으로 운영되어, 정원이 차면 모집 기간 중에도 <strong>조기 마감</strong>될 수 있어요.</li>
            <li>모임 일정이 변경될 경우 문자 또는 카카오톡으로 미리 안내드려요.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><strong>환불</strong> 기준</h2>
          <div className={styles.refundBox}>
            <div className={styles.refundGrid}>
              <span className={styles.refundWhen}>첫 모임(1회차) 시작 1주일 전까지</span>
              <span className={styles.refundHow}>전액 환불</span>
              <span className={styles.refundWhen}>1회차 참여 후 중단할 때</span>
              <span className={styles.refundHow}>미참여 회차 금액 환불</span>
              <span className={styles.refundWhen}>2회차 참여 이후</span>
              <span className={`${styles.refundHow} ${styles.refundHowMuted}`}>환불 불가</span>
              <span className={styles.refundWhen}>최소 인원 미달로 반이 열리지 않을 때</span>
              <span className={styles.refundHow}>전액 환불</span>
            </div>
          </div>
          <ul className={styles.list}>
            <li>매 회차의 발제문과 진행을 미리 기획해 준비하기 때문에, <strong>2회차 참여 이후에는 환불이 어려운 점</strong> 미리 양해를 구해요.</li>
            <li>환불은 시즌 참여를 완전히 중단하시는 경우에 적용돼요 — 일부 회차만 불참하시는 경우는 환불 사유가 되지 않아요.</li>
            <li>천재지변 등 불가항력으로 모임이 취소되는 경우에는 전액 환불해 드려요.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>환불 <strong>신청 방법</strong></h2>
          <ul className={styles.list}>
            <li>등록하신 연락처로 문자를 주시거나, 인스타그램 DM(@lazyday_bookclub)으로 편하게 접수해 주세요.</li>
            <li>영업일 기준 3~5일 내에 처리되며, 별도의 환불 수수료는 없어요.</li>
          </ul>
          <p className={styles.note}>
            *본 안내는 {SEASON.name} 기준이며, 기수별 구성에 따라 일부 내용이 조정될 수 있습니다.
          </p>
        </section>

        <div className={styles.contact}>
          <p className={styles.contactText}>더 궁금한 점이 있어요</p>
          <a
            href="https://www.instagram.com/lazyday_bookclub"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.contactLink}
          >
            인스타그램 DM으로 편하게 물어보세요 →
          </a>
        </div>
      </div>
    </main>
  )
}
