import type { Metadata } from "next"
import { LazydayLink } from "@/components/common/LazydayLink"
import { TermsBody } from "./TermsBody"
import styles from "./terms.module.css"

export const metadata: Metadata = {
  title: "이용약관 · 레이지데이",
  description: "레이지데이 통합 이용약관 — 모임(용역)·제품(재화)·배송",
  // 두 도메인(북클럽·레이지클럽)에서 열리는 중복 콘텐츠 — 상대 canonical은
  // metadataBase 호스트 분기 덕에 각 도메인 자기 정본으로 해석된다 (SEO 2026-08-12)
  alternates: { canonical: "/terms" },
}

/**
 * 통합 이용약관 (2026-08-11 프로덕션 이관 — 운영자 "선조치 후검토").
 * 기수제 북클럽만 다루는 /lazyday/policy(법률 검토 완료본)와 별개로,
 * **전 상품**(일회성 모임=용역, 제품=재화, 배송)을 아우른다. 기수제는 기존
 * 약관이 특칙으로 우선(제4조). 소비자: checkout '이용약관·환불 규정 전문
 * 보기' + 레이지클럽 셸 푸터 '이용약관'. URL: 북클럽 도메인 /terms,
 * lazy-club.com /terms (middleware 화이트리스트).
 *
 * 서술구조: 브라운야드·노아(카페24)의 공정위 전자상거래 표준약관 골격
 * (합니다체) + 용역(모임) 장 신설. ⚠ 법률 자문 후검토 대기 — 조문 수정은
 * TermsBody.tsx 한 곳만 (프리뷰 페이지와 원문 공유).
 */

export default function TermsPage() {
  return (
    <main className={styles.standalonePage}>
      {/* 워크룸 서체 — 전역 미로드라 페이지에서 로드 (checkout과 같은 방식) */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
      />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@300;600&display=swap" />
      <div className={styles.standaloneContainer}>
        <div className={styles.navRow}>
          <LazydayLink href="/" className={styles.navLink}>
            홈
          </LazydayLink>
          <span className={styles.navDivider} aria-hidden />
          <LazydayLink href="/policy" className={styles.navLink}>
            레이지데이 북클럽 이용약관
          </LazydayLink>
        </div>
        <TermsBody />
      </div>
    </main>
  )
}
