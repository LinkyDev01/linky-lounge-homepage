# Lazyday 보조 일러스트 — 양귀비 시리즈 (Poppy Series)

> Hero PNG는 그대로 두고, 보조 일러스트는 **양귀비 한 송이의 일생을 그린 botanical study** 시스템으로 통일합니다.

## 한 줄 컨셉

봉오리 → 만개 → 떨어진 꽃잎 → 씨앗 꼬투리. 페이지를 스크롤하는 동안 양귀비 한 송이가 피고 지는 시간을 함께 보내게 됨.

## 결정 (확정 사항)

- **종**: 양귀비 (Poppy / *Papaver*)
- **톤**: 단색 라인 드로잉 (terracotta `#d2691e`, fill 없음)
- **제작 방식**: SVG 컴포넌트 — Nano Banana 거치지 않고 코드에 인라인
- **위치**: `components/illustrations/poppy/` (이미 작성 완료)

## 왜 양귀비인가 — 한 페이지짜리 정당화

| 기준 | 양귀비가 충족시키는 방식 |
|---|---|
| 다른 북클럽과 차별화 | 트레바리·문학동네·민음사 누구도 양귀비를 쓰지 않음 |
| Brand color와 일치 | terracotta = 양귀비 색 |
| 책·문학 연관성 | Monet, O'Keeffe, *In Flanders Fields*, 페르세포네 신화 |
| 시간 단계 명료성 | 봉오리 드룹 → 펑 만개 → 며칠 만에 다 떨어짐 → 씨앗 꼬투리 (4단계) |
| 시그니처 silhouette | 씨앗 꼬투리 모양은 한눈에 양귀비라는 게 보임 |
| 시즌 카피와 호응 | 2기 사랑의 기술 "확신이 생기면 시작하겠다는 사람은 시작하지 못한다" — 봉오리가 망설이다가 한 번에 터지는 양귀비의 시간 |

## 작성된 컴포넌트 (8개)

### Atoms (5)

```tsx
import { Petal, Bud, Bloom, SeedPod, Leaf } from "@/components/illustrations/poppy"
```

| 컴포넌트 | 의미 | 주 사용처 |
|---|---|---|
| `<Bud />` | 망설이는 봉오리 (드룹) | How 01, divider |
| `<Bloom />` | 만개한 4-petal 꽃 | How 02, Specimen·Cluster의 메인 |
| `<Petal />` | 떨어진 꽃잎 | divider, Apply 장식 |
| `<SeedPod />` | 씨앗 꼬투리 (시그니처 silhouette) | How 03, Apply 위치 마커 |
| `<Leaf />` | lobed 잎사귀 | divider, 보조 |

### Compositions (3)

```tsx
import { Specimen, Cluster, Solo } from "@/components/illustrations/poppy"
```

| 컴포넌트 | 의미 | 주 사용처 |
|---|---|---|
| `<Specimen />` | 한 그루에 모든 단계가 달린 식물도감 | About 인용구 옆 (showcase) |
| `<Cluster />` | 세 줄기 (봉오리·만개·씨앗) 한 뿌리 | Vibe 카드 1 ("어떤 대화") |
| `<Solo />` | 단독 양귀비 + 떨어진 꽃잎 | Vibe 카드 2 ("어떤 사람") |

## 섹션별 사용 매핑

| 섹션 | 일러스트 | 의미 |
|---|---|---|
| Hero | (기존 PNG 유지) | 거실 장면 그대로 |
| About | `<Specimen />` (인용구 옆) | 정제된 식물 study |
| Vibe 카드 1 ("어떤 대화") | `<Cluster />` | 여러 결의 사람이 한 자리에 |
| Vibe 카드 2 ("어떤 사람") | `<Solo />` | 혼자 책에 머무는 시간 |
| How 01 (시작) | `<Bud />` | 망설이는 봉오리 |
| How 02 (절정) | `<Bloom />` | 만개 |
| How 03 (마무리) | `<SeedPod />` | 무엇이 남는가 |
| Schedule | — | 일러스트 없음 |
| FAQ | (선택) `<Leaf />` 작게 | 가벼운 deco |
| Apply CTA | 작은 `<SeedPod />` | 위치 핀, 마침의 여운 |
| 섹션 디바이더 | `<Petal />` `<Leaf />` `<Bud />` | parallax로 흩뿌려진 잎 |

## 사용 패턴 (코드 스니펫)

### 단순 사용

```tsx
import { Specimen } from "@/components/illustrations/poppy"

<div className="flex gap-8 items-start">
  <blockquote className="text-2xl">복잡함 속에서 찾는 단순함.</blockquote>
  <Specimen className="w-32 h-48 text-[#d2691e] shrink-0" />
</div>
```

### 옅은 디바이더로

```tsx
import { Petal } from "@/components/illustrations/poppy"

<div className="absolute top-10 right-8 -z-10">
  <Petal className="w-10 h-10 text-[#d2691e]/25" />
</div>
```

### Framer Motion parallax

```tsx
"use client"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { Leaf } from "@/components/illustrations/poppy"

function FloatingLeaf() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], [40, -120])
  const rotate = useTransform(scrollYProgress, [0, 1], [-10, 25])
  return (
    <div ref={ref} className="absolute top-32 left-12">
      <motion.div style={{ y, rotate }}>
        <Leaf className="w-14 h-14 text-[#d2691e]/30" />
      </motion.div>
    </div>
  )
}
```

### 라인이 그려지는 효과 (How 타임라인용)

각 atom 컴포넌트의 첫 번째 main `<path>` 만 motion.path로 변환해 `pathLength: 0 → 1` 애니메이션. atom 컴포넌트를 직접 수정하지 않고, 별도의 motion wrapper나 동일한 SVG를 motion으로 다시 작성한 컴포넌트를 만들어 사용 권장.

## 디자인 원칙 (다음에 추가 일러스트 만들 때 따를 것)

1. 양귀비 외 다른 식물 모티프 추가 금지 (시그니처 일관성)
2. 색은 `currentColor` 단색만, fill="none" 기본
3. Stroke 굵기 혼합 — main 1.0px, secondary 0.7px, detail 0.4–0.5px
4. 절대 중앙 정렬 안 함, composition은 비대칭
5. 작은 dot 몇 개로 시간·여백 암시 (stippling)
6. Hero PNG와 한 화면에 두었을 때 톤이 충돌 안 하는지 검증

## Nano Banana는 어디에?

이번 시스템에서는 사용 안 함 — 양귀비 시리즈가 SVG로 충분히 표현됨. 다만 다음 경우엔 Nano Banana를 추가로 쓸 수 있음:

- Hero PNG 보조 3프레임 cross-fade loop (선택, "9. (선택) 새 Hero 보조 일러스트 — Vertical Banner" 섹션 참고했던 케이스)
- 모임 중 사진의 빈자리에 들어가는 더 회화적인 컷 (필요 시)
- Apply 페이지의 더 친밀한 분위기 일러스트 (선택)

위 경우만 Nano Banana 활용. 마스터 시드는:

```
Botanical illustration of a single poppy stem in the same hand-drawn ink line style
as the lazyday brand poppy series. Single color terracotta (#d2691e), no fill,
slightly imperfect lines (hand-drawn quality), asymmetric composition with
generous negative space. Mix of line weights (main 1px, detail 0.5px).
Multiple stages of one poppy in one composition: drooping bud, full bloom,
fallen petal, seed pod with stigma crown.
Reference: minumsa.minumsa.com/bookclub botanical illustrations.
```

## 컴포넌트 미리보기

`/components/illustrations/poppy/README.md` 참고. 또는 다음 단계로 storybook이나 dev preview 페이지 만들기 권장 — `app/(main)/_dev/poppy-preview/page.tsx` 같은 식으로 8개 컴포넌트를 한 화면에서 볼 수 있게.
