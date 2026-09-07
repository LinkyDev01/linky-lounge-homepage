"use client"

import styles from "./link-reveal.module.css"

export type RevealVariant = "snap" | "sweep" | "capsule" | "pop"

/**
 * 한 글자씩 깜빡이는 링크 (시안, 2026-09-07) — 인물 약력의 '네비올로'·'네그로니'(→ 커피앤바) 전용.
 *
 * 운영자: "네___ / _비___ / __올_ / ___로 와 같이 한 글자씩만 깜빡이면서 노출 … 0.5초 정도 …
 *          굵기도 다른 하이퍼링크 대비 한 단계 위계 강하게 … 커서를 갖다 대면 모든 글자가 노출되고
 *          약간의 동적인 요소".
 *
 * 쉬는 상태 = 글자 하나만 잉크, 나머지는 헤어라인 알파 — 유휴 오버레이의 워드서치 필드가
 * "숨어 있던 LAZY만 또렷해지는" 그 문법이다. 이 링크는 약력 속에 숨은 단어이고, 커피앤바
 * 페이지의 "네그로니는 없습니다 / 네비올로도 없습니다"와 짝을 이루는 농담이라 그 문법이 맞다.
 * 전환은 **스텝**(페이드 없음) — 운영자 "프레임을 끊어서 더 딱딱하게"(2026-08-27).
 *
 * ⚠ 4글자 전용이다. 켜지는 구간(25%)이 키프레임에 박혀 있어 글자 수가 다르면 겹치거나 빈다.
 *   두 단어(네비올로·네그로니)가 다 4글자라 그대로 두었다 — 다른 길이가 생기면 키프레임을 나눈다.
 * ⚠ 밑줄은 단어 전체에 상시 — 글자가 꺼져 있어도 "여기가 링크"라는 폭은 남는다.
 */
export function BlinkLink({
  href,
  text,
  variant,
}: {
  href: string
  text: string
  variant: RevealVariant
}) {
  const letters = Array.from(text)
  return (
    <a href={href} className={`${styles.blink} ${styles[variant]}`} data-variant={variant}>
      {letters.map((ch, i) => (
        <span key={i} className={styles.letter} style={{ ["--i" as string]: i }}>
          {ch}
        </span>
      ))}
    </a>
  )
}
