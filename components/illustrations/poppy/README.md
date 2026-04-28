# 양귀비 시리즈 (Poppy Illustration System)

> Lazyday 북클럽의 시그니처 비주얼 아이덴티티. 한 페이지를 스크롤하는 동안 양귀비 한 송이의 일생을 함께 보내는 botanical study.

## 컨셉 한 줄

봉오리 → 만개 → 떨어진 꽃잎 → 씨앗 꼬투리. **"확신이 생기면 시작하겠다는 사람은 시작하지 못한다"** (사랑의 기술 시즌 카피)와 정확히 겹치는 식물의 시간.

## 왜 양귀비인가

- **Silhouette이 가장 distinctive** — stigma 왕관이 얹힌 둥근 씨앗 꼬투리는 다른 어떤 꽃과도 안 헷갈림 → 브랜드 시그니처로 작동
- **Literary heritage** — Monet의 《Poppy Field》, Georgia O'Keeffe, *In Flanders Fields*, 페르세포네 신화. 책 읽는 사람들에게 익숙한 모티프
- **시간의 단계가 또렷함** — 다른 꽃은 "피었다 진다" 두 단계지만, 양귀비는 봉오리가 떨군 자세에서 사흘쯤 망설이다가 한 번에 펑 터지고, 며칠 만에 다 떨어지고, 씨앗 꼬투리만 오래 남음 → 4단계 서사
- **터라코타 #d2691e = 양귀비 색** — 브랜드 컬러와 물리적 일치
- **다른 북클럽이 안 씀** — 트레바리·문학동네·민음사 그 누구도 양귀비를 마스코트로 쓰지 않음

## 구성

5개의 **atom** (단일 plant 요소) + 3개의 **composition** (여러 atom의 조합) = 8개 컴포넌트

### Atoms

| 컴포넌트 | viewBox | 의미 | 주 사용처 |
|---|---|---|---|
| `<Bud />` | 100×100 | 망설이는 봉오리 | How 01, divider |
| `<Bloom />` | 120×100 | 만개한 꽃 | How 02, Specimen·Cluster의 메인 |
| `<Petal />` | 100×100 | 떨어진 꽃잎 한 장 | divider, Apply CTA, Closing 장식 |
| `<SeedPod />` | 80×100 | 씨앗 꼬투리 (시그니처) | How 03, Apply 위치 마커, divider |
| `<Leaf />` | 100×100 | lobed 잎사귀 | divider, 보조 요소 |

### Compositions

| 컴포넌트 | viewBox | 의미 | 주 사용처 |
|---|---|---|---|
| `<Specimen />` | 240×360 | 한 그루에 모든 단계가 달린 식물도감 specimen | AboutSection (showcase) |
| `<Cluster />` | 320×280 | 세 줄기 (봉오리·만개·씨앗) 한 뿌리에 | VibeSection 카드 1 |
| `<Solo />` | 240×360 | 단독 양귀비, 떨어진 꽃잎 곁에 | VibeSection 카드 2 |

## 사용법

### 기본 import

```tsx
import { Petal, Bud, Bloom, SeedPod, Leaf, Specimen, Cluster, Solo } from "@/components/illustrations/poppy"
```

### 색상 조절

모든 컴포넌트는 `stroke="currentColor"` 를 사용합니다. 부모 요소의 `color` 속성에 따라 색이 바뀝니다.

```tsx
{/* 기본 terracotta */}
<Specimen className="text-[#d2691e]" />

{/* 옅게 (디바이더용) */}
<Petal className="text-[#d2691e]/30 w-8 h-8" />

{/* 다크모드 대응 */}
<Bloom className="text-orange-700 dark:text-orange-300" />
```

### 크기 조절

`className`에 Tailwind의 `w-*` `h-*` 또는 `w-[120px]` 같은 임의 사이즈를 지정. SVG는 viewBox 기반 비율로 자동 스케일.

```tsx
{/* 작은 디바이더 */}
<Leaf className="w-6 h-6" />

{/* 중간 강조 */}
<Bloom className="w-24 h-20" />

{/* 큰 showcase */}
<Specimen className="w-48 h-72" />
```

### 접근성

기본은 장식용 (aria-hidden). 의미가 있는 경우 `title` prop을 넘기면 aria-label이 됨.

```tsx
{/* 장식 (대부분의 경우) */}
<Petal />

{/* 의미 있는 경우 */}
<Specimen title="양귀비 한 송이의 일생" />
```

### Framer Motion과 함께

```tsx
import { motion } from "framer-motion"
import { Petal } from "@/components/illustrations/poppy"

{/* Parallax로 떠다니는 디바이더 */}
<motion.div
  style={{ y: useTransform(scrollYProgress, [0, 1], [0, -80]) }}
  className="absolute top-20 right-10"
>
  <Petal className="w-12 h-12 text-[#d2691e]/40" />
</motion.div>

{/* 스크롤 시 그려지는 효과는 atom 컴포넌트를 직접 만들어 motion.path로 구현
    (atom 컴포넌트는 motion.path로 변환 가능 - 필요 시 별도 wrapper) */}
```

## 섹션별 사용 매핑

| 섹션 | 일러스트 | 효과 |
|---|---|---|
| Hero | (기존 PNG 유지) | — |
| About | `<Specimen>` (인용구 옆) | "정제된 study, 시간을 들인 식물" |
| Vibe 카드 1 ("어떤 대화") | `<Cluster>` | "여러 결의 사람이 한 자리에" |
| Vibe 카드 2 ("어떤 사람") | `<Solo>` | "혼자 책에 머무는 시간" |
| How 01 (레이지노트 펼치기) | `<Bud>` | 시작 — 망설이는 봉오리 |
| How 02 (서로의 페이지) | `<Bloom>` | 절정 — 만개 |
| How 03 (마무리) | `<SeedPod>` | 끝 — 무엇이 남는가 |
| Schedule | (없음) | — |
| FAQ | (없음 또는 작은 `<Leaf>`) | — |
| Apply CTA | 작은 `<SeedPod>` (위치 마커) | 마침의 여운 |
| 섹션 사이 divider | `<Petal>` `<Leaf>` `<Bud>` 셋을 rotate | parallax로 흩뿌려진 잎 |

## 디자인 원칙 (이후 추가 컴포넌트 만들 때 따를 것)

1. **터라코타 단일색** — `stroke="currentColor"`로 두고 부모에서 색 지정
2. **Fill 없음** — `fill="none"` 기본. 점만 `fill="currentColor"`로 solid
3. **혼합 stroke 굵기** — main 1.0px, secondary 0.7~0.8px, detail 0.4~0.5px
4. **비대칭** — 절대 중앙 정렬하지 말 것. composition은 한쪽으로 치우침
5. **Stippling으로 분위기** — 작은 `<circle r={0.5}>` 점 몇 개로 시간·여백 암시
6. **여백이 composition의 일부** — 빈 공간이 답답하지 않을 때까지 비울 것
7. **양귀비 외 다른 plant 모티프 추가 금지** — 시리즈의 일관성이 곧 시그니처

## 아직 안 만든 것 (필요 시 추가)

- `<Mark>` — 카탈로그 라벨처럼 작은 십자형 마크. Apply CTA의 강조용
- `<Sketch>` — 더 거친 스케치 버전 (잡지 illustration 느낌)
- `<HeroAccent>` — Hero 일러스트(PNG)와 함께 쓸 수 있는 작은 양귀비 1송이 SVG
- `<Logomark>` — favicon·brand mark용 단순화된 양귀비 silhouette
