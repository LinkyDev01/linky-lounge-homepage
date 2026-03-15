"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trackCustom } from "@/lib/meta-pixel"

interface HeaderProps {
  variant?: "main" | "lounge" | "platform"
}

export function Header({ variant = "main" }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const config = {
    main: {
      logo: { href: "/", image: "/logos/linky_care_logo.png", width: 120, height: 30, className: "h-22 w-auto" },
      navItems: [
        { href: "/lounge", label: "링키라운지" },
        { href: "/platform", label: "링키케어" },
        { href: "#contact", label: "문의하기" },
      ],
      ctaButton: { bg: "bg-[#9CB7A4] hover:bg-[#8AA594]", text: "시작하기" },
    },
    lounge: {
      logo: { href: "/lounge", image: "/logos/linky_lounge_logo_white.svg", width: 120, height: 113, className: "h-10 w-auto" },
      navItems: [
        { href: "/study-foreign", label: "회화 스터디" },
        { href: "https://linky-wine-party01.vercel.app/", label: "와인파티", external: true },
        { href: "https://focus-night.vercel.app/", label: "몰입의 밤", external: true },
        { href: "https://tally.so/r/lbrdkN", label: "감튀 소개팅", external: true },
        { href: "/book-club", label: "북클럽", external: true }
      ],
      ctaButton: { bg: "bg-[#9CB7A4] hover:bg-[#8AA594]", text: "예약하기" },
    },
    platform: {
      logo: { href: "/platform", image: "/logos/linky_care_logo.png", width: 120, height: 30, className: "h-22 w-auto" },
      navItems: [
        { href: "/platform", label: "서비스 소개" },
        { href: "/platform#features", label: "기능" },
        { href: "/platform#how-it-works", label: "이용 방법" },
        { href: "/", label: "Linky 홈" },
      ],
      ctaButton: { bg: "bg-[#00C896] hover:bg-[#00B085]", text: "앱 다운로드" },
    },
  }

  const { logo, navItems, ctaButton } = config[variant]
  const isLounge = variant === "lounge"

  // Lounge variant uses transparent header with white text
  const headerBg = isLounge
    ? isScrolled
      ? "bg-black/30 backdrop-blur-md"
      : "bg-transparent"
    : isScrolled
      ? "bg-background/80 backdrop-blur-md border-b border-border"
      : "bg-transparent"

  const textColor = isLounge
    ? "text-white/90 hover:text-white"
    : "text-muted-foreground hover:text-foreground"

  const iconColor = isLounge ? "text-white" : "text-foreground"

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href={logo.href} className="flex items-center">
            <Image
              src={logo.image}
              alt={variant === "lounge" ? "Linky Lounge" : "Linky"}
              width={logo.width}
              height={logo.height}
              className={logo.className}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-10">
            {navItems.map((item) => (
              "external" in item && item.external ? (
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
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-2 ${iconColor}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="메뉴 토글"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className={`md:hidden py-6 ${isLounge ? "bg-black/50 backdrop-blur-md -mx-4 px-4" : "border-t border-border"}`}>
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                "external" in item && item.external ? (
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
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
