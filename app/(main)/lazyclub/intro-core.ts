/**
 * 랜딩 인트로의 **순수 코어** — 배열·타임라인·상태 함수 (2026-08-22 추출).
 *
 * 랜딩(ComingSoonMain)과 하위 페이지 인트로 오버레이(IntroOverlay)가 **같은 것을 읽는다**.
 * 사본을 뜨면 연출이 두 벌로 갈라져 한쪽만 손보는 사고가 난다 — 추출의 유일한 이유다.
 * 렌더는 각자 하고(랜딩은 페이지로, 오버레이는 화면 위로) 이 파일은 값만 낸다.
 *
 * 구현 주의(원문 유지): 난수는 마운트 시 시드 하나만 뽑고 stateAt 은 **읽기만** 한다 —
 * 프레임마다 Math.random() 을 부르면 화면이 발작하듯 재추첨된다.
 */

// 오프닝 1.0s — WELCOME TO + 채움 X (라운드 48 도입 · 54에서 0.5s→1.0s)
export const WELCOME = [
  ["W", "E", "L", "X"],
  ["C", "O", "M", "E"],
  ["T", "O", "X", "X"],
  ["X", "X", "X", "X"],
]
// 최종 배열 — 2행 = LAZY(가로), 1열 = CLUB(세로, L 공유).
// 나머지 9칸을 행 순서로 읽으면 W E L C O M E T O (라운드 48)
export const GRID = [
  ["C", "W", "E", "L"],
  ["L", "A", "Z", "Y"],
  ["U", "C", "O", "M"],
  ["B", "E", "T", "O"],
]
export const HOT = new Set(["0-0", "1-0", "2-0", "3-0", "1-1", "1-2", "1-3"]) // C·L·U·B + A·Z·Y

export const PALETTE = ["#f49938", "#96ab9b", "#845d5e"]
export const INK = "#1a1208"
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

/* 타임라인 (ms) — 1회성, 총 5.0s */
export const T = {
  WELCOME: 1000, // 웰컴 정지 화면 종료 — 셔플 시작 (라운드 54: 0.5s → 1.0s)
  FIX: 3000, // 셔플 종료(2.0s) — LAZY·CLUB 고정
  CAP_LAZY: 3300, // LAZY 동그라미 — 글자 확정 후 0.3s, 한 번에 짠 (라운드 59)
  CAP_CLUB: 3600, // CLUB 동그라미 — 다시 0.3s 뒤
  END: 4600, // 최종 상태 — 써클까지 그린 뒤 1.0s 유지하고 내비·푸터 노출 (라운드 60)
}

/** 결정적 해시 → [0,1) — 시드·칸·틱이 같으면 항상 같은 값 (프레임 간 안정) */
function rnd(seed: number, a: number, b: number) {
  let h = (seed ^ (a * 374761393) ^ (b * 668265263)) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  h = (h ^ (h >>> 16)) >>> 0
  return h / 4294967296
}

export type Cell = { ch: string; color: string }

/** 경과시간 + 시드 → 화면 상태 (순수 함수 — 모든 연출의 단일 출처) */
export function stateAt(raw: number, seed: number) {
  const e = Math.min(raw, T.END)
  const wordColor = PALETTE[Math.floor(rnd(seed, 4242, 1) * 3)]

  const cells: Cell[] = []
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const i = r * 4 + c
      if (e < T.WELCOME) {
        // 오프닝 — 잉크 단색 정지 (색 규칙과 별개)
        cells.push({ ch: WELCOME[r][c], color: INK })
        continue
      }
      // 칸별 셔플 간격 60~140ms (시드로 고정)
      const interval = 60 + rnd(seed, i, 999) * 80
      // 고정 이후에는 마지막 틱에 멈춘다 → 색이 이어진다
      const tick = Math.floor((Math.min(e, T.FIX - 1) - T.WELCOME) / interval)
      if (e < T.FIX) {
        cells.push({
          ch: ALPHABET[Math.floor(rnd(seed, i, tick) * 26)],
          color: PALETTE[Math.floor(rnd(seed, i, tick + 7) * 3)],
        })
      } else {
        // LAZY·CLUB은 단색 통일. 나머지 9칸은 셔플 마지막 색을 잇되,
        // 그 색이 단색과 같으면 나머지 2색 중 하나로 치환 —
        // 써클 주위 글자는 써클 안 텍스트와 반드시 다른 색 (운영자 지시)
        let color = PALETTE[Math.floor(rnd(seed, i, tick + 7) * 3)]
        if (HOT.has(`${r}-${c}`)) {
          color = wordColor
        } else if (color === wordColor) {
          const others = PALETTE.filter((p) => p !== wordColor)
          color = others[Math.floor(rnd(seed, i, 555) * 2)]
        }
        cells.push({ ch: GRID[r][c], color })
      }
    }
  }

  return {
    cells,
    capLazy: e >= T.CAP_LAZY,
    capClub: e >= T.CAP_CLUB,
    done: e >= T.END,
  }
}

/** 시드 전(SSR 포함) 첫 페인트 — 웰컴 배열 잉크 단색. 배치는 이후와 동일 */
export const INITIAL: Cell[] = WELCOME.flat().map((ch) => ({ ch, color: INK }))
