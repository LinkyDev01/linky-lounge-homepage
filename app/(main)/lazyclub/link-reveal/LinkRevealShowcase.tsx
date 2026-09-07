"use client"

import { Children, cloneElement, isValidElement, useState, type ReactNode } from "react"
import { WorkroomShell } from "../Shell"
import { HostIntro } from "../HostIntro"
import { PEOPLE } from "../people-config"
import { DeferredCss } from "@/components/common/DeferredCss"
import { BlinkLink, type RevealVariant } from "./BlinkLink"
import styles from "./link-reveal.module.css"

/**
 * 인물 약력의 커피앤바 링크(네비올로·네그로니) 점멸 시안 — 실배치 + 스위처 (2026-09-07).
 *
 * 왜 실배치인가: 효과의 느낌은 주변 본문(Gothic A1 500, 1.85행간, 다른 700 링크들) 사이에서
 * 정해진다. 단어만 떼어 쇼케이스로 보이면 판단이 어긋난다(IntroRuleLab 2026-08-24 교훈).
 * 그래서 사람 페이지와 **같은 서식(HostIntro)·같은 원고(people-config)** 위에 링크만 바꿔 끼운다.
 *
 * ⚠ 원고는 한 글자도 복사하지 않았다 — people-config 의 ReactNode 를 그대로 받아, 커피앤바로
 *   가는 <a> 만 BlinkLink 로 갈아끼운다(swapCoffeeLinks). 실이식 때도 이 방식이면 원고 사본이 안 생긴다.
 *
 * 내비 미등록·noindex. 실이식은 별건.
 */

const VARIANTS: { key: RevealVariant; label: string; desc: string }[] = [
  { key: "snap", label: "A 일제 점등", desc: "커서를 대면 네 글자가 한 번에 켜진다. 그 밖엔 아무것도 더하지 않는다." },
  { key: "sweep", label: "B 순차 점등", desc: "왼쪽부터 한 글자씩 60ms 간격으로 켜진다 — 스텝, 페이드 없음." },
  { key: "capsule", label: "C 찾은 단어에 동그라미", desc: "전부 켜지며 워드서치의 '찾았다' 캡슐이 왼쪽 끝부터 4단계로 그어진다." },
  { key: "pop", label: "D 글자 팝 (채택)", desc: "전부 켜지며 글자마다 1.24배 튀는 물결이 1초마다 반복된다 (40ms 스태거). 커서를 대고 있는 동안 계속." },
]

function isCoffeeLink(el: React.ReactElement<{ href?: string }>) {
  return el.type === "a" && typeof el.props.href === "string" && el.props.href.includes("/meetings/dm-gd")
}

/** people-config 의 약력(ReactNode)에서 커피앤바 링크만 BlinkLink 로 교체 — 원고 복사 없음 */
function swapCoffeeLinks(node: ReactNode, variant: RevealVariant): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement(child)) return child
    const el = child as React.ReactElement<{ href?: string; children?: ReactNode }>
    if (isCoffeeLink(el)) {
      const text = typeof el.props.children === "string" ? el.props.children : String(el.props.children ?? "")
      return <BlinkLink href={el.props.href!} text={text} variant={variant} />
    }
    if (el.props.children === undefined) return el
    return cloneElement(el, undefined, swapCoffeeLinks(el.props.children, variant))
  })
}

export function LinkRevealShowcase() {
  const [variant, setVariant] = useState<RevealVariant>("pop")
  const current = VARIANTS.find((v) => v.key === variant)!

  return (
    <WorkroomShell>
      {/* Gothic A1 800 — 셸은 700 까지만 싣는다. 이 시안만 한 단계 위 굵기가 필요하다 (schedule·turtle 선례) */}
      <DeferredCss href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@800&display=swap" />
      <div className={styles.page}>
        <header className={styles.head}>
          <h1>약력 링크 점멸 시안</h1>
          <p>네비올로 · 네그로니 → 커피앤바. 쉴 때 한 글자씩만 검게, 나머지는 배경색(투명). 0.5초 순환, 굵기 800(다른 링크 700). 커서를 대면 전부.</p>
        </header>

        <nav className={styles.switch} aria-label="호버 반응 시안">
          {VARIANTS.map((v) => (
            <button
              key={v.key}
              type="button"
              className={v.key === variant ? styles.on : undefined}
              onClick={() => setVariant(v.key)}
              aria-pressed={v.key === variant}
            >
              {v.label}
            </button>
          ))}
        </nav>
        <p className={styles.note}>{current.desc}</p>

        {PEOPLE.map((p) => (
          <section key={p.slug} className={styles.section}>
            <p className={styles.sectionTitle}>/people/{p.slug}</p>
            <HostIntro photo={p.photo} name={p.name} instagram={p.instagram}>
              {swapCoffeeLinks(p.bio, variant)}
            </HostIntro>
          </section>
        ))}
      </div>
    </WorkroomShell>
  )
}
