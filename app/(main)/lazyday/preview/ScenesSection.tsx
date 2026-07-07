import Image from "next/image"
import styles from "./ScenesSection.module.css"
import { FadeUp } from "@/components/animation/FadeUp"
import { SCENES_LEFT, SCENES_RIGHT, type Scene } from "./scenes-config"

/**
 * 장면들(SCENES) — 사진 큐레이션 종이 콜라주 (프리뷰 전용, 2026-07-07 신설).
 * 눈썹 "SCENES" + 좌열 3 / 우열 3 매트(종이 액자·워시테이프). 제목·설명문 없음.
 * 데이터는 scenes-config.ts. 두 열이 모두 비면 섹션 자체를 렌더하지 않는다.
 * 실사이트 이식·배포는 사진 확보 + 운영자 승인 대기.
 */

// 위치 기반 회전(도) — 매트와 테이프 각각 좌/우열 index로 부여
const MAT_ROT = { left: [-0.8, 0.5, -0.4], right: [0.9, -0.6, 0.4] }
const TAPE_ROT = { left: [0, 1.5, -2], right: [-1, 2, 0] }

function SceneFigure({
  scene,
  matRot,
  tapeRot,
  delay,
}: {
  scene: Scene
  matRot: number
  tapeRot: number
  delay: number
}) {
  return (
    <FadeUp y={10} duration={0.6} delay={delay}>
      <figure className={styles.figure} style={{ transform: `rotate(${matRot}deg)` }}>
        <span
          className={styles.tape}
          style={{ transform: `translateX(-50%) rotate(${tapeRot}deg)` }}
          aria-hidden
        />
        <div className={styles.imgBox} style={{ height: `${scene.height}px` }}>
          <Image
            src={scene.src}
            alt={scene.alt}
            fill
            sizes="(max-width: 480px) 55vw, 230px"
            loading="lazy"
            style={{ objectFit: "cover" }}
          />
        </div>
        {scene.caption && <figcaption className={styles.caption}>{scene.caption}</figcaption>}
      </figure>
    </FadeUp>
  )
}

export function ScenesSection() {
  // 사진 확보 전(두 열 모두 빈 배열)이면 섹션 자체를 렌더하지 않는다 — 노출 0
  if (SCENES_LEFT.length === 0 && SCENES_RIGHT.length === 0) return null

  return (
    <section className={styles.section}>
      <FadeUp y={12} duration={0.9} className={styles.eyebrowWrap}>
        <p className={styles.eyebrow}>SCENES</p>
      </FadeUp>
      <div className={styles.collage}>
        <div className={styles.colLeft}>
          {SCENES_LEFT.map((scene, i) => (
            // 시각 순서(좌1→우1→좌2→우2…): 좌열 index i의 순서는 i*2
            <SceneFigure
              key={`l-${i}`}
              scene={scene}
              matRot={MAT_ROT.left[i] ?? 0}
              tapeRot={TAPE_ROT.left[i] ?? 0}
              delay={0.06 * (i * 2)}
            />
          ))}
        </div>
        <div className={styles.colRight}>
          {SCENES_RIGHT.map((scene, i) => (
            <SceneFigure
              key={`r-${i}`}
              scene={scene}
              matRot={MAT_ROT.right[i] ?? 0}
              tapeRot={TAPE_ROT.right[i] ?? 0}
              delay={0.06 * (i * 2 + 1)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
