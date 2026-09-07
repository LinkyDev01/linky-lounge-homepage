"use client"

import styles from "./blink-link.module.css"

export type RevealVariant = "snap" | "sweep" | "capsule" | "pop"

/**
 * 한 글자씩 깜빡이는 링크 (2026-09-07) — 인물 약력의 '네비올로'·'네그로니'(→ 커피앤바) 전용.
 *
 * 운영자: "네___ / _비___ / __올_ / ___로 와 같이 한 글자씩만 깜빡이면서 노출 … 0.5초 … 굵기도 다른
 *   하이퍼링크 대비 한 단계 위 … 커서를 갖다 대면 모든 글자가 노출되고 약간의 동적인 요소" →
 *   시안 4안 중 **D 글자 팝 채택**, "D가 반복되게 / 글자가 아예 안 보이고 한 글자씩만 블랙으로 /
 *   언더바는 다른 하이퍼링크처럼 / 밑줄까지 팝은 안 되게 / 커서 올리면 무한반복".
 *
 * 쉬는 상태 = 글자 하나만 잉크, 나머지는 **배경색(투명)** — 유휴 오버레이 워드서치의 "숨어 있던
 * 단어만 또렷" 문법. 이 링크는 약력 속에 숨은 단어이고 도착지가 "네그로니는 없습니다"인 짝 농담이라
 * 그 문법이 맞다. 전환은 스텝(페이드 없음) — 운영자 "프레임을 끊어서 더 딱딱하게".
 *
 * ⚠ **밑줄은 <a> 의 ::after 한 줄**이다(글자별 text-decoration 아님). 글자가 팝(transform)할 때
 *   밑줄까지 같이 튀면 안 되고(운영자), 글자를 inline-block 으로 두면 부모의 text-decoration 은
 *   그 위에 그려지지 않는다. 그래서 변형되지 않는 <a> 가 절대배치 밑줄을 갖는다 — 위치는
 *   실측으로 다른 링크의 밑줄(offset 3px·1px)과 픽셀 일치시켰다(blink-link.module.css `--ul-bottom`).
 * ⚠ 4글자 전용 — 켜지는 구간(25%)이 키프레임에 박혀 있다. 두 단어가 다 4글자다.
 * ⚠ 사람 목록 카드(.personCard)에서는 점멸하지 않는다 — 카드는 링크 강조를 전부 푸는 자리라
 *   home.module.css 가 글자·밑줄을 평문으로 되돌린다.
 *
 * 소비자: people-config(사람 상세·모임 상세 PersonIntro) · /lazyclub/link-reveal(시안, variant 스위처).
 */
export function BlinkLink({
  href,
  text,
  variant = "pop",
}: {
  href: string
  text: string
  variant?: RevealVariant
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
