import Link from "next/link"
import { Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="text-background/50 text-sm space-y-1">
              <p>주식회사 링키</p>
              <p>대표 : 안동민 | 개인정보관리책임자 : 안동민</p>
              <p>사업자등록번호 : 557-81-03588 | 통신판매업신고번호: 2026-별내-0077</p>
              <p>이메일 : linkylounge@gmail.com | 대표번호 : 010-7444-5790</p>
              <p>주소: 경기도 남양주시 별내3로 322, 404호</p>
              <a
                href="https://www.instagram.com/linky_lounge"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-background/70 transition-colors"
              >
                <Instagram className="w-4 h-4" />
                Instagram
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">서비스</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/lounge" className="text-background/70 hover:text-background transition-colors">
                  링키라운지
                </Link>
              </li>
              <li>
                <Link href="/platform" className="text-background/70 hover:text-background transition-colors">
                  링키케어
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-background/70">
              <li>linkylounge@gmail.com</li>
              <li>010-7444-5790</li>
              <li>
                <a
                  href="https://www.instagram.com/linky_lounge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-background transition-colors inline-flex items-center gap-1"
                >
                  <Instagram className="w-4 h-4" />
                  @linky_lounge
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-8">
          <p className="text-background/50 text-sm text-center">
            © 2026 Linky Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
