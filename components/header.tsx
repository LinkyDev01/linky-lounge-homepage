"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { trackCustom } from "@/lib/meta-pixel"

const logo = { href: "/", image: "/logos/linky_lounge_logo_white.svg", width: 120, height: 113, className: "h-7 md:h-10 w-auto" }
const navItems = [
  { href: "/study-foreign", label: "회화 스터디" },
  { href: "https://linky-wine-party01.vercel.app/", label: "와인파티", external: true },
  { href: "https://focus-night.vercel.app/", label: "몰입의 밤", external: true },
  { href: "https://tally.so/r/lbrdkN", label: "감튀 소개팅", external: true },
  { href: "/book-club", label: "북클럽", external: true },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const headerBg = isScrolled ? "bg-black/30 backdrop-blur-md" : "bg-transparent"
  const textColor = "text-white/90 hover:text-white"

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-20">
          {/* Logo */}
          <Link href={logo.href} className="flex items-center">
            <Image
              src={logo.image}
              alt="Linky Lounge"
              width={logo.width}
              height={logo.height}
              className={logo.className}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-10">
            {navItems.map((item) =>
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${textColor} transition-colors text-sm font-medium tracking-wide uppercase`}
                  onClick={() => trackCustom("Navigation", { item: item.label })}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${textColor} transition-colors text-sm font-medium tracking-wide uppercase`}
                  onClick={() => trackCustom("Navigation", { item: item.label })}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="메뉴 토글"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-6 bg-black/50 backdrop-blur-md -mx-4 px-4">
            <div className="flex flex-col gap-4">
              {navItems.map((item) =>
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${textColor} transition-colors py-2 text-sm font-medium tracking-wide uppercase`}
                    onClick={() => { trackCustom("Navigation", { item: item.label }); setIsMenuOpen(false) }}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${textColor} transition-colors py-2 text-sm font-medium tracking-wide uppercase`}
                    onClick={() => { trackCustom("Navigation", { item: item.label }); setIsMenuOpen(false) }}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
