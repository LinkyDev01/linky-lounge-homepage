// ================================================================
// 모임소개(FeatureQuietSection) 챕터 사진 변환 (15e 시안, 2026-07-28)
//
// 사용: node scripts/convert-feature-photos.mjs <원본 디렉터리>
//
// 원본 디렉터리의 이미지(jpg/png/webp)를 파일명 순으로 정렬해
// people → books → questions → space 챕터에 대응시키고,
// 폭 1560px(표시 780px의 2x) · WebP q78로 변환해
// public/linky-lounge/book-club/feature/feature-<key>.webp 로 저장한다.
// 목표 용량: 파일당 150KB 이하 — 초과하면 품질을 6씩 낮춰 재시도(최저 q60).
//
// ⚠ 채도 0.85 · 대비 0.97 보정 1장만 적용 (CSS 필터 금지 — 운영자 지시).
//   지시 문면은 '두 번째(books)'였으나 근거(프로젝터 화면의 청록)에 해당하는
//   사진은 4번(space, 라운지 프로젝터 컷)이어서 space에 적용 (2026-07-28 재해석).
// JPG 원본은 커밋하지 않는다 — 변환 결과 webp만 레포에 들어간다.
// ================================================================
import sharp from "sharp"
import { readdirSync, mkdirSync } from "node:fs"
import path from "node:path"

const KEYS = ["people", "books", "questions", "space"]
/** 채도·대비 보정 대상 — 프로젝터 청록이 담긴 사진 (헤더 주석 참조) */
const TONE_FIX_KEY = "space"
const OUT_DIR = "public/linky-lounge/book-club/feature"
const WIDTH = 1560 // 표시 폭 780px 기준 2x
const QUALITY = 78

const srcDir = process.argv[2]
if (!srcDir) {
  console.error("사용법: node scripts/convert-feature-photos.mjs <원본 디렉터리>")
  process.exit(1)
}

const files = readdirSync(srcDir)
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .sort()
if (files.length !== KEYS.length) {
  console.error(`이미지 ${KEYS.length}개가 필요한데 ${files.length}개 발견: ${files.join(", ")}`)
  process.exit(1)
}

mkdirSync(OUT_DIR, { recursive: true })

for (let i = 0; i < KEYS.length; i++) {
  const key = KEYS[i]
  let img = sharp(path.join(srcDir, files[i]))
    .rotate() // EXIF 방향 반영
    .resize({ width: WIDTH, withoutEnlargement: true })
  if (key === TONE_FIX_KEY) {
    // 채도 0.85 + 대비 0.97 (linear: out = 0.97·in + 255·0.5·0.03 — 중앙 기준 대비 축소)
    img = img.modulate({ saturation: 0.85 }).linear(0.97, 255 * 0.5 * 0.03)
  }
  const outPath = path.join(OUT_DIR, `feature-${key}.webp`)
  let info
  let q = QUALITY
  for (;;) {
    info = await img.webp({ quality: q }).toFile(outPath)
    if (info.size <= 150 * 1024 || q <= 60) break
    q -= 6
  }
  const kb = info.size / 1024
  console.log(
    `${files[i]} → ${outPath}  ${info.width}x${info.height}  q${q}  ${kb.toFixed(0)}KB${kb > 150 ? "  ⚠ 150KB 초과 (q 최저치 도달)" : ""}`,
  )
}
