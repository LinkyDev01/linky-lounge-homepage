import styles from "./turtle-loader.module.css"

/**
 * 지구를 도는 거북이 로더 — 운영자 제공 원안(2026-08-21)의 이식본.
 * 지구 SVG·궤도 기하(0.8042·0.4021·0.2879 계수)·걸음 시퀀스는 원안 그대로다.
 * 원안의 5프레임 PNG 는 스프라이트 시트 한 장으로 합쳐 배경 위치로 넘긴다
 * (JS 프레임 교체 → CSS 애니. 요청 1건·4KB, 서버 컴포넌트로 렌더 가능).
 * 속도는 원안이 제시한 3단(4·12·30초) 중 제출 대기에 맞는 4초.
 */
export function TurtleLoader({ label = "접수 중..." }: { label?: string }) {
  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.earth}>
          <svg viewBox="0 0 240 240">
            <circle className={styles.globeDisc} cx="120" cy="120" r="94" />
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M 50 88 C 46 68 66 56 88 56
                   C 106 56 116 64 130 62
                   C 148 60 160 72 156 88
                   C 152 100 140 102 134 112
                   C 130 124 122 134 112 132
                   C 104 130 104 122 96 118
                   C 84 112 68 120 58 112
                   C 50 106 50 98 50 88 Z"
              />
              <path d="M 148 114 C 142 124 143 138 151 148 C 160 138 160 122 156 114 Z" />
              <path d="M 172 114 C 182 126 186 144 180 158 C 172 146 168 128 172 114 Z" />
              <ellipse cx="116" cy="154" rx="9" ry="5.5" transform="rotate(-12 116 154)" />
              <path
                d="M 140 170 C 152 160 168 162 174 172
                   C 178 183 164 189 152 185 C 142 182 137 176 140 170 Z"
              />
            </g>
            <circle cx="120" cy="120" r="94" fill="none" stroke="currentColor" strokeWidth="5" />
          </svg>
        </div>
        <div className={styles.orbit}>
          <span className={styles.rider} />
        </div>
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  )
}
