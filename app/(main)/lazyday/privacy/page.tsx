import type { Metadata } from "next"
import { LazydayLink } from "@/components/common/LazydayLink"
import styles from "../policy/page.module.css"

export const metadata: Metadata = {
  title: "개인정보처리방침 · 레이지데이 북클럽",
  description: "주식회사 링키 레이지데이 북클럽 개인정보처리방침",
  // 두 도메인 중복 콘텐츠 — 상대 canonical (metadataBase 호스트 분기, SEO 2026-08-12)
  alternates: { canonical: "/privacy" },
}

/**
 * 개인정보처리방침 (2026-08-11 신설 — PG 심사 대비, 운영자 "법률 검토해서 최소한으로").
 * 이용약관 제15조가 참조하는 문서. 개인정보 보호법 제30조 필수 기재사항 + 해당되는
 * 법정 고지 2건(제28조의8 국외 이전 — Google·Vercel이 국외 사업자 / 자동 수집 장치 —
 * Meta Pixel·Google Analytics 실사용)을 최소 범위로 담는다.
 * 수집 항목은 신청 폼 실측(이름·성별·나이·연락처·한 줄 인사·인스타그램), 처리위탁은
 * 실사용 수탁사(Google·Vercel·솔라피·토스페이먼츠) 기준. 조판은 policy 페이지 재사용
 * (page.module.css 소비자 추가 — 클래스 변경 없음).
 */

function Article({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.article}>
      <h3 className={styles.articleTitle}>{title}</h3>
      {children}
    </div>
  )
}

export default function LazydayPrivacyPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <LazydayLink href="/" className={styles.backLink}>← 레이지데이 북클럽 홈</LazydayLink>

        <div className={styles.titleRow}>
          <h1 className={styles.pageTitle}>개인정보처리방침</h1>
        </div>

        <p className={styles.clause}>
          주식회사 링키(이하 &ldquo;회사&rdquo;라 한다)는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고
          이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개한다.
        </p>

        <Article title="제1조 (개인정보의 처리 목적)">
          <p className={styles.clause}>회사는 다음의 목적을 위하여 개인정보를 처리한다. 처리한 개인정보는 다음 목적 이외의 용도로는 이용하지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행한다.</p>
          <ol className={styles.clauseList}>
            <li>모임 신청 접수 및 참가자 관리: 레이지데이 북클럽(기수제) 및 원데이 토크 등 모임의 신청 접수, 인터뷰 진행, 참가 확정, 일정·장소 안내</li>
            <li>결제 및 환불 처리: 참가비 결제 확인, 취소·환불 처리</li>
            <li>마케팅 및 광고 활용(선택 동의 시): 새 모임·행사 소식 안내</li>
          </ol>
        </Article>

        <Article title="제2조 (수집하는 개인정보의 항목 및 수집 방법)">
          <ol className={styles.clauseList}>
            <li>수집 항목
              <ol className={styles.itemList}>
                <li>필수: 이름, 성별, 나이, 휴대전화번호, 개인정보 수집·이용 동의 시각</li>
                <li>선택: 한 줄 인사(자기소개), 인스타그램 아이디, 참여 불가 요일, 알게 된 경로</li>
                <li>결제 시: 결제 승인 정보(주문번호, 결제 수단, 승인 시각 — 카드번호 등 결제 원문 정보는 결제대행사가 처리하며 회사는 보관하지 않는다), 제품 택배 수령 선택 시 배송지 주소</li>
                <li>굿즈 택배 배송 선택 시: 수령인 이름, 연락처, 배송지 주소</li>
              </ol>
            </li>
            <li>수집 방법: 웹사이트 신청 폼(lazyday-bookclub.com, lazy-club.com, linkylounge.com), 전화·서면 인터뷰</li>
          </ol>
        </Article>

        <Article title="제3조 (개인정보의 처리 및 보유 기간)">
          <ol className={styles.clauseList}>
            <li>모임 신청·참가자 관리 정보: 해당 모임(기수) 종료 후 1년까지 보유하며, 이후 지체 없이 파기한다. 다만 정보주체가 삭제를 요청하는 경우 즉시 파기한다.</li>
            <li>관계 법령에 따라 보존이 필요한 정보는 해당 법령이 정한 기간 동안 보존한다.
              <ol className={styles.itemList}>
                <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (같은 법)</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (같은 법)</li>
              </ol>
            </li>
            <li>마케팅 활용 정보(선택 동의): 동의 철회 시까지</li>
          </ol>
        </Article>

        <Article title="제4조 (개인정보의 제3자 제공)">
          <p className={styles.clause}>
            회사는 정보주체의 개인정보를 제1조에서 명시한 범위 내에서만 처리하며, 정보주체의 동의 또는 법률의 특별한 규정 등
            「개인정보 보호법」 제17조에 해당하는 경우에만 개인정보를 제3자에게 제공한다. 현재 회사는 개인정보를 제3자에게 제공하지 않는다.
          </p>
        </Article>

        <Article title="제5조 (개인정보 처리의 위탁)">
          <p className={styles.clause}>회사는 원활한 업무 처리를 위하여 다음과 같이 개인정보 처리 업무를 위탁하고 있다.</p>
          <ol className={styles.clauseList}>
            <li>Google LLC: 신청 정보의 저장·관리 (Google Sheets, Google Apps Script)</li>
            <li>Vercel Inc.: 웹사이트 호스팅 및 운영</li>
            <li>주식회사 솔라피(Solapi): 문자·알림톡 발송</li>
            <li>주식회사 토스페이먼츠: 전자결제 처리(결제 승인·취소)</li>
            {/* 표기명은 포트원 공식 안내대로 '코리아포트원' — '포트원'·'PortOne'·'(주)포트원' 금지 */}
            <li>코리아포트원: 결제 연동 서비스 제공</li>
          </ol>
          <p className={styles.clause}>
            회사는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행 목적 외 개인정보 처리 금지, 기술적·관리적
            보호조치 등을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독한다.
          </p>
        </Article>

        <Article title="제6조 (개인정보의 국외 이전)">
          <p className={styles.clause}>
            회사는 서비스 제공을 위하여 다음과 같이 개인정보 처리를 국외 사업자에게 위탁하고 있으며, 이 과정에서
            개인정보가 국외로 이전된다. 정보주체는 아래 연락처(제11조의 개인정보 보호책임자)로 국외 이전을 거부할 수
            있으나, 거부하는 경우 신청 접수 등 서비스 이용이 제한될 수 있다.
          </p>
          <ol className={styles.clauseList}>
            <li>Google LLC (미국)
              <ol className={styles.itemList}>
                <li>이전 항목: 제2조의 수집 항목 전체 / 이전 시기·방법: 신청 접수 시 정보통신망을 통한 전송</li>
                <li>이용 목적: 신청 정보의 저장·관리(처리위탁) / 보유 기간: 제3조의 보유 기간 종료 시까지</li>
                <li>연락처: support.google.com (개인정보 문의 창구)</li>
              </ol>
            </li>
            <li>Vercel Inc. (미국)
              <ol className={styles.itemList}>
                <li>이전 항목: 웹사이트 이용 과정에서 처리되는 정보 / 이전 시기·방법: 웹사이트 접속 시 정보통신망을 통한 전송</li>
                <li>이용 목적: 웹사이트 호스팅(처리위탁) / 보유 기간: 위탁 계약 종료 시까지</li>
                <li>연락처: privacy@vercel.com</li>
              </ol>
            </li>
          </ol>
        </Article>

        <Article title="제7조 (개인정보 자동 수집 장치의 설치·운영 및 거부)">
          <ol className={styles.clauseList}>
            <li>회사 웹사이트는 서비스 개선과 광고 성과 측정을 위하여 쿠키 등 자동 수집 장치를 사용한다. 이를 통해 수집되는 정보는 접속 기록, 방문 페이지 등 웹사이트 이용 정보이며, 개인을 직접 식별하는 정보는 포함하지 않는다.
              <ol className={styles.itemList}>
                <li>Google Analytics (Google LLC): 방문·이용 통계 분석</li>
                <li>Meta Pixel (Meta Platforms, Inc.): 광고 성과 측정</li>
              </ol>
            </li>
            <li>정보주체는 브라우저 설정에서 쿠키 저장을 거부하거나 삭제할 수 있다. 다만 쿠키 저장을 거부할 경우 일부 서비스 이용에 어려움이 있을 수 있다.</li>
          </ol>
        </Article>

        <Article title="제8조 (정보주체의 권리·의무 및 행사 방법)">
          <ol className={styles.clauseList}>
            <li>정보주체는 회사에 대해 언제든지 개인정보의 열람·정정·삭제·처리정지를 요구할 수 있다.</li>
            <li>권리 행사는 이메일(contact@linkylounge.com), 전화(010-7444-5790) 또는 카카오톡 채널을 통해 할 수 있으며, 회사는 지체 없이 조치한다.</li>
            <li>권리 행사는 정보주체의 법정대리인이나 위임을 받은 자를 통하여도 할 수 있다.</li>
            <li>마케팅 수신 동의는 선택 사항이며, 동의하지 않아도 모임 이용에 제한이 없다. 동의 후에도 언제든지 철회할 수 있다.</li>
          </ol>
        </Article>

        <Article title="제9조 (개인정보의 파기)">
          <ol className={styles.clauseList}>
            <li>회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기한다.</li>
            <li>전자적 파일 형태의 정보는 복구할 수 없는 방법으로 삭제하며, 종이 문서는 분쇄하거나 소각하여 파기한다.</li>
          </ol>
        </Article>

        <Article title="제10조 (개인정보의 안전성 확보 조치)">
          <ol className={styles.clauseList}>
            <li>개인정보 접근 권한의 최소화 및 관리</li>
            <li>개인정보 전송 구간의 암호화(HTTPS)</li>
            <li>접근 통제를 위한 인증 수단 적용</li>
          </ol>
        </Article>

        <Article title="제11조 (개인정보 보호책임자)">
          <p className={styles.clause}>
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을
            위하여 아래와 같이 개인정보 보호책임자를 지정하고 있다.
          </p>
          <ol className={styles.clauseList}>
            <li>개인정보 보호책임자: 안동민 (대표)</li>
            <li>연락처: contact@linkylounge.com, 010-7444-5790</li>
          </ol>
          <p className={styles.clause}>
            기타 개인정보 침해에 대한 신고나 상담이 필요한 경우 개인정보침해 신고센터(privacy.kisa.or.kr, 국번 없이 118),
            개인정보 분쟁조정위원회(kopico.go.kr, 1833-6972) 등에 문의할 수 있다.
          </p>
        </Article>

        <Article title="제12조 (개인정보처리방침의 변경)">
          <p className={styles.clause}>
            이 개인정보처리방침은 2026년 8월 11일부터 적용된다. 내용의 추가·삭제 및 수정이 있을 경우 시행 7일 전부터
            웹사이트를 통해 고지한다.
          </p>
        </Article>
      </div>
    </main>
  )
}
