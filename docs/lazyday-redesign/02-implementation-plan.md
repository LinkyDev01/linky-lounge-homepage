# 02. 남은 구현 작업 — main 비교 후 재작성본

## 상황 정리

이 문서의 처음 버전은 lazyday 페이지를 처음부터 새로 만드는 11단계 PR을 가정했어요. 하지만 main 브랜치를 직접 확인해보니 **와이어프레임의 70% 정도가 이미 구현되어 있었습니다**.

남은 작업은 두 가지뿐입니다:

1. **양귀비 일러스트 시스템 통합** (`components/illustrations/poppy/` 의 8개 SVG를 각 섹션에 import해서 배치)
2. **Framer Motion 모션 레이어 추가** (스크롤 fade-in, parallax, 디바이더 떠다니는 잎)

위 두 가지가 lazyday를 트레바리·민음사와 다른 "독보적 미감"으로 끌어올리는 추가 가치예요.

## main에 이미 들어있는 것 (재구현 금지)

| 영역 | 상태 |
|---|---|
| 폴더 구조 (`app/(main)/lazyday/`) | ✅ |
| `book-config.ts` season1·2 데이터 | ✅ |
| `NavBar.tsx` (sticky tabs + active state) | ✅ |
| `BookSubNav.tsx` (이번/지난 기수 토글) | ✅ |
| `AboutSection.tsx` redesign | ✅ |
| `VibeSection.tsx` (RulesSection 대신 신설) | ✅ |
| `HowToSection.tsx` 세로 timeline | ✅ |
| `ScheduleSection.tsx` 회차별 row + 격주 표기 + 미드나잇 | ✅ |
| `BookSection.tsx` past seasons smooth open/close | ✅ |
| `FaqSection.tsx` redesign | ✅ |
| `ClosingSection.tsx` redesign | ✅ |
| Hero 이미지 `lazyday_poster_v2.png` | ✅ |
| 색상 팔레트 개편 | ✅ |

## 0단계 — 로컬 워크스페이스를 main과 sync

```bash
cd C:\Users\KPMG\lounge-dev\lounge-homepage-main

# 제가 만든 양귀비 일러스트 + docs 보존
git add components/illustrations/poppy/ docs/lazyday-redesign/
git commit -m "WIP: 양귀비 일러스트 시스템 + 핸드오프 문서 추가"

# main pull (book-club → lazyday rename, 새 컴포넌트들 다 들어옴)
git fetch origin
git pull origin main
```

이후 작업 브랜치 분기:
```bash
git checkout -b feature/poppy-illustrations
```

## 1단계 — 의존성 + 공용 wrapper

```bash
npm install framer-motion
```

### `components/animation/FadeUp.tsx` (신규)

```tsx
"use client"
import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"

type Props = {
  children: ReactNode
  delay?: number
  duration?: number
  y?: number
  className?: string
  once?: boolean
}

export function FadeUp({ children, delay = 0, duration = 0.6, y = 24, className, once = true }: Props) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
```

### `components/animation/ParallaxFloat.tsx` (신규 — 디바이더 양귀비 잎용)

```tsx
"use client"
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"
import { useRef, type ReactNode } from "react"

type Props = {
  children: ReactNode
  className?: string
  yRange?: [number, number]      // default [40, -120]
  rotateRange?: [number, number] // default [-10, 25]
}

export function ParallaxFloat({ children, className, yRange = [40, -120], rotateRange = [-10, 25] }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], yRange)
  const rotate = useTransform(scrollYProgress, [0, 1], rotateRange)
  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y, rotate }}>
        {children}
      </motion.div>
    </div>
  )
}
```

## 2단계 — 양귀비 일러스트 통합

### AboutSection.tsx

지금 main의 AboutSection은 매우 단순한 lead + body 구조예요. 인용구 옆에 `<Specimen />` 한 장만 추가:

```tsx
import styles from "./AboutSection.module.css"
import { Specimen } from "@/components/illustrations/poppy"
import { FadeUp } from "@/components/animation/FadeUp"

export function AboutSection() {
  return (
    <section id="about" className={styles.section}>
      <FadeUp><h2 className={styles.sectionTitle}>레이지데이 북클럽은</h2></FadeUp>
      <div className={styles.leadRow}>
        <FadeUp delay={0.05}>
          <p className={styles.lead}>복잡함 속에서 찾는 단순함.</p>
        </FadeUp>
        <Specimen className={styles.specimen} aria-hidden />
      </div>
      <FadeUp delay={0.1}>
        <p className={styles.body}>
          일상을 더 복잡하게 만드는 질문들은<br />앞세우지 않으려고 해요.
        </p>
      </FadeUp>
      <FadeUp delay={0.15}>
        <p className={styles.body}>
          중요한 건 딱 두 가지입니다.<br />
          이 책의 진짜 의도가 무엇인지,<br />
          그리고 거기서 내 이야기가 나올 수 있는지.
        </p>
      </FadeUp>
      <FadeUp delay={0.2}>
        <p className={styles.body}>
          백 번의 독서모임을 하며 결국<br />제게 남은 질문도 이것뿐이었거든요.
        </p>
      </FadeUp>
      <FadeUp delay={0.25}>
        <p className={styles.body}>
          결국 이곳에 남는 건 책의 지식이 아니라<br />당신의 이야기, 그리고 당신만의 방향입니다.
        </p>
      </FadeUp>
    </section>
  )
}
```

CSS 추가 (`AboutSection.module.css`):
```css
.leadRow {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}
.specimen {
  width: 90px;
  height: auto;
  color: #d2691e;
  flex-shrink: 0;
  opacity: 0.85;
}
@media (max-width: 480px) {
  .leadRow { flex-direction: column; gap: 16px; }
  .specimen { width: 70px; align-self: flex-end; margin-right: 8px; }
}
```

### VibeSection.tsx

main은 두 question 블록 단순 list. 각 블록에 일러스트 추가:

```tsx
import styles from './VibeSection.module.css'
import { Cluster, Solo } from "@/components/illustrations/poppy"
import { FadeUp } from "@/components/animation/FadeUp"

const items = [
  {
    question: '모임에선 어떤 대화가 오가나요?',
    paragraphs: [/* 기존 그대로 */],
    Illustration: Cluster,
  },
  {
    question: '어떤 사람과 함께하고 있나요?',
    paragraphs: [/* 기존 그대로 */],
    Illustration: Solo,
  },
]

export function VibeSection() {
  return (
    <section id="vibe" className={styles.section}>
      <FadeUp><h2 className={styles.sectionTitle}>이런 모임이에요</h2></FadeUp>
      <div className={styles.list}>
        {items.map(({ question, paragraphs, Illustration }, i) => (
          <FadeUp key={question} delay={i * 0.1} className={styles.block}>
            <Illustration className={styles.blockIllustration} />
            <p className={styles.question}>{question}</p>
            <div className={styles.quote}>
              {paragraphs.map((p, j) => (<p key={j} className={styles.paragraph}>{p}</p>))}
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  )
}
```

CSS 추가:
```css
.blockIllustration {
  width: 140px;
  height: auto;
  color: #d2691e;
  margin-bottom: 16px;
  opacity: 0.9;
}
```

### HowToSection.tsx

main은 세로 timeline에 단계별 dot. dot 자리에 양귀비 atom 일러스트로 교체:

```tsx
import styles from "./HowToSection.module.css"
import { Bud, Bloom, SeedPod } from "@/components/illustrations/poppy"
import { FadeUp } from "@/components/animation/FadeUp"

const steps = [
  { label: "1부 — 레이지노트 펼치기", description: /* 기존 */, Illustration: Bud },
  { label: "2부 — 서로의 페이지",     description: /* 기존 */, Illustration: Bloom },
  { label: "마무리",                   description: /* 기존 */, Illustration: SeedPod },
]

export function HowToSection() {
  return (
    <section id="howto" className={styles.section}>
      <FadeUp><h2 className={styles.sectionTitle}>진행 순서</h2></FadeUp>
      <FadeUp delay={0.05}><p className={styles.meta}>총 3시간 진행</p></FadeUp>
      <div className={styles.timeline}>
        {steps.map(({ label, description, Illustration }, i) => (
          <FadeUp key={label} delay={i * 0.1} className={styles.step}>
            <Illustration className={styles.stepIcon} />
            <div className={styles.stepContent}>
              <span className={styles.stepLabel}>{label}</span>
              <p className={styles.stepDesc}>{description}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  )
}
```

CSS 변경 — 기존 `.dot`을 `.stepIcon`으로 교체:
```css
.stepIcon {
  width: 32px;
  height: 32px;
  color: #d2691e;
  flex-shrink: 0;
  margin-top: 2px;
}
```
> 기존 `.dot` 스타일은 삭제. 세로 timeline 라인은 `::before`로 그려져있으면 유지.

### ClosingSection.tsx — 위치 마커

```tsx
import { SeedPod, Petal } from "@/components/illustrations/poppy"
// ...
<p className={styles.location}>
  <SeedPod className={styles.locationMarker} aria-hidden />
  <span>사당역 10번 출구 도보 4분 · 링키라운지</span>
</p>
```

```css
.locationMarker { width: 18px; height: 22px; color: #d2691e; flex-shrink: 0; }
```

### 디바이더 — 섹션 사이 떠다니는 양귀비 잎

`app/(main)/lazyday/page.tsx` 수정:

```tsx
import { ParallaxFloat } from "@/components/animation/ParallaxFloat"
import { Petal, Leaf, Bud } from "@/components/illustrations/poppy"

// main 안에 흩뿌리기
<main className={styles.container}>
  {/* 기존 hero, sections 그대로 */}

  {/* 디바이더 (절대 위치, 섹션 사이마다) */}
  <ParallaxFloat className={styles.divider1}><Petal className={styles.dividerLeaf} /></ParallaxFloat>
  <ParallaxFloat className={styles.divider2} rotateRange={[20, -10]}><Leaf className={styles.dividerLeaf} /></ParallaxFloat>
  <ParallaxFloat className={styles.divider3}><Bud className={styles.dividerLeaf} /></ParallaxFloat>
</main>
```

CSS:
```css
.container { position: relative; }
.divider1 { position: absolute; top: 30vh; right: -8px; pointer-events: none; }
.divider2 { position: absolute; top: 70vh; left: -12px; pointer-events: none; }
.divider3 { position: absolute; top: 110vh; right: 8px; pointer-events: none; }
.dividerLeaf {
  width: 36px;
  height: 36px;
  color: rgba(210, 105, 30, 0.22);
}
```

> 디바이더 위치(`top` 값)는 실제 모바일에서 보면서 미세조정 권장. 섹션 사이 빈 공간에 살짝 떠다니는 정도가 베스트.

## 3단계 (선택) — ScrollProgressBar

```tsx
// components/animation/ScrollProgressBar.tsx
"use client"
import { motion, useScroll, useSpring } from "framer-motion"

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  return (
    <motion.div
      style={{
        scaleX,
        transformOrigin: "0 50%",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: "#d2691e",
        zIndex: 60,
      }}
    />
  )
}
```

`page.tsx`에 추가:
```tsx
import { ScrollProgressBar } from "@/components/animation/ScrollProgressBar"
// NavBar 위에 배치
<ScrollProgressBar />
<NavBar />
```

## PR 분리 (3-4개로 짧게)

| PR | 제목 | 변경 파일 |
|---|---|---|
| 1 | feat: install framer-motion + FadeUp + ParallaxFloat wrappers | `package.json`, `components/animation/*` |
| 2 | feat: 양귀비 일러스트 — Specimen·Cluster·Solo (About / Vibe) | `AboutSection.tsx`+css, `VibeSection.tsx`+css |
| 3 | feat: 양귀비 일러스트 — Bud·Bloom·SeedPod (How / Closing 위치 마커) | `HowToSection.tsx`+css, `ClosingSection.tsx`+css |
| 4 | feat: 디바이더 — 떠다니는 Petal·Leaf·Bud (parallax) | `page.tsx`, `page.module.css` |
| 5 (선택) | feat: ScrollProgressBar | `components/animation/ScrollProgressBar.tsx`, `page.tsx` |

## 검증 체크리스트

- [ ] iPhone 14 Pro (390×844)와 Galaxy S8 (360×740)에서 모바일 뷰 OK
- [ ] 일러스트 색상이 hero 이미지와 충돌하지 않음 (모두 terracotta 톤)
- [ ] `prefers-reduced-motion: reduce` 시 애니메이션 비활성화 (FadeUp / ParallaxFloat이 자동 처리)
- [ ] 디바이더 일러스트가 본문 텍스트를 가리지 않음 (`pointer-events: none` 확인)
- [ ] Lighthouse Performance ≥ 85 (모바일)
- [ ] 일러스트 SVG 인라인이라 추가 네트워크 요청 0개

## 한 번에 다 적용 vs 단계별

작업량이 작아서 (총 7-8 파일 수정) 한 번에 다 적용해도 무리는 없습니다. 다만 PR 단위로 나눠 올리시면:
- PR 2까지만 머지해보고 일러스트 톤이 페이지에 어울리는지 시각적으로 검증 가능
- 마음에 안 들면 PR 3 진행 전에 일러스트 디자인만 다시 조정 가능

## 알려진 위험

1. **2기 책 표지 4장 존재 여부** — `public/linky-lounge/book-club/books/2기-*.jpg` 파일이 실제로 있는지 동민님이 확인 필요. 없으면 `next/image` 가 404날 수 있음.
2. **양귀비 일러스트 톤 검증** — 실제 페이지에 올렸을 때 hero 이미지와 톤이 맞는지는 dev 서버 띄우고 봐야 정확히 알 수 있음. 안 맞으면 SVG 컴포넌트의 `stroke` 색을 hero에 맞춰 미세 조정.
