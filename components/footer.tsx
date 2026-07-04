import Link from "next/link"

type FooterProps = {
  /** 기본값은 링키라운지 채널. 레이지데이 등 별도 브랜드 페이지에서 덮어쓴다. */
  instagramUrl?: string
  kakaoUrl?: string
  /** /policy 링크 라벨 — 레이지데이는 "이용약관 및 환불 규정"으로 덮어쓴다 */
  policyLabel?: string
}

/** 공식 브랜드 색상의 원형 배지 — 소셜 링크 관행 표기 */
function InstagramBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="footer-ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FEE411" />
          <stop offset="15%" stopColor="#FEDA77" />
          <stop offset="30%" stopColor="#F58529" />
          <stop offset="55%" stopColor="#DD2A7B" />
          <stop offset="75%" stopColor="#8134AF" />
          <stop offset="100%" stopColor="#515BD4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#footer-ig-grad)" />
      <rect x="8" y="8" width="16" height="16" rx="5" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="21.6" cy="10.4" r="1.1" fill="#fff" />
    </svg>
  )
}

function KakaoTalkBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#FEE500" />
      <path
        d="M16 8.4c-5.05 0-9.15 3.24-9.15 7.24 0 2.57 1.69 4.82 4.25 6.1-.19.69-.68 2.49-.78 2.87 0 0-.02.13.06.18.08.05.17.01.17.01.23-.03 2.57-1.68 2.98-1.97.79.11 1.6.17 2.47.17 5.05 0 9.15-3.24 9.15-7.24S21.05 8.4 16 8.4Z"
        fill="#3C1E1E"
      />
    </svg>
  )
}

export function Footer({
  instagramUrl = "https://www.instagram.com/linky_lounge",
  kakaoUrl = "http://pf.kakao.com/_cuWDn",
  policyLabel = "교환환불정책",
}: FooterProps = {}) {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 좌측: 사업자정보 */}
          <div>
            <h4 className="font-semibold mb-4">사업자정보</h4>
            <ul className="space-y-2 text-background/70 text-sm">
              <li>주식회사 링키</li>
              <li>대표 : 안동민 | 개인정보관리책임자 : 안동민</li>
              <li>사업자등록번호 : 557-81-03588 | 통신판매업신고번호: 2026-별내-0077</li>
              <li>이메일 : contact@linkylounge.com | 대표번호 : 010-7444-5790</li>
              <li>주소: 경기도 남양주시 별내3로 322, 404호</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">고객지원</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link
                  href="/policy"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  {policyLabel}
                </Link>
              </li>
              <li className="flex items-center gap-3">
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:opacity-80 transition-opacity">
                  <InstagramBadge className="w-7 h-7" />
                </a>
                <a href={kakaoUrl} target="_blank" rel="noopener noreferrer" aria-label="KakaoTalk" className="hover:opacity-80 transition-opacity">
                  <KakaoTalkBadge className="w-7 h-7" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 mt-8 pt-6">
          <p className="text-background/50 text-sm text-center">
            © 2026 Linky Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
