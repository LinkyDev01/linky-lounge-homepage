import Link from "next/link"
import { Instagram } from "lucide-react"

type FooterProps = {
  /** 기본값은 링키라운지 채널. 레이지데이 등 별도 브랜드 페이지에서 덮어쓴다. */
  instagramUrl?: string
  kakaoUrl?: string
  /** /policy 링크 라벨 — 레이지데이는 "이용약관 및 환불 규정"으로 덮어쓴다 */
  policyLabel?: string
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
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/policy"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  {policyLabel}
                </Link>
              </li>
              <li>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-background/70 hover:text-background transition-colors inline-flex items-center gap-1"
                >
                  <Instagram className="w-4 h-4" />
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={kakaoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-background/70 hover:text-background transition-colors inline-flex items-center gap-1"
                >
                  <svg className="w-4 h-4" viewBox="0 0 300 300" fill="currentColor">
                    <path d="M150,40.992c-56.923,0-103.069,42.684-103.069,95.336,0,38.887,16.287,57.45,38.593,74.373l.107.046v45.636a2.621,2.621,0,0,0,4.184,2.1L128.9,229.452l.841.365A111.675,111.675,0,0,0,150,231.663c56.924,0,103.069-42.684,103.069-95.335S206.924,40.992,150,40.992" />
                  </svg>
                  KakaoTalk
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
