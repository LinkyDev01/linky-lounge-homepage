import Link from "next/link"
import { Instagram } from "lucide-react"

export function LoungeFooter() {
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
              <li>이메일 : linkylounge@gmail.com | 대표번호 : 010-7444-5790</li>
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
                  교환환불정책
                </Link>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/linky_lounge"
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
                  href="http://pf.kakao.com/_cuWDn"
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
              <li>
                <a
                  href="https://naver.me/FLebi2a9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-background/70 hover:text-background transition-colors inline-flex items-center gap-1"
                >
                  <svg className="w-4 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
                  </svg>
                  Naver
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
