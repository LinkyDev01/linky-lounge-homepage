# env-notes — 포스터·서체·웹킷 심층 노트

> CLAUDE.md §5 에서 이관한 심층 세부 (2026-08-24 문서 다이어트).
> **히어로 포스터·서체 파이프라인·웹킷 검증을 건드리는 세션은 이 문서 필독.**
> 여기 내용은 전부 실측으로 얻은 규율이다 — 임의로 되돌리지 말 것.

## 히어로 포스터 (숨 쉬는 포스터)

- **글자 배치는 "브라우저에 묻지 않는다"** (2026-08-17 전환). 실 위 474자의 좌표·각도·크기는 빌드 타임 산출물 `poster-metrics.ts`(생성기 `scripts/gen_poster_layout.py`)와 순수 계산 모듈 `poster-place.ts` 가 정한다. `<textPath>`·`startOffset`·폭 측정·경로 스케일은 전부 **폐기** — 되살리지 말 것. 그 구조가 iOS 겹침·고갈·이음매 구멍·로드별 크기 편차의 공통 원인이었다.
- 포스터 **문구·경로·자간**이 바뀌면: ⓐ 서브셋 서체 재생성(`pyftsubset pv.woff2 --text-file=… --flavor=woff2 --layout-features='*'`) ⓑ `python3 scripts/gen_poster_layout.py` ⓒ 산출물 커밋. 순서를 건너뛰면 글자가 실을 못 채우거나 넘친다.
- `dominant-baseline` 금지 — 엔진마다 적용 지점이 다르다(크롬은 `<text>` 에서 무시, 웹킷은 자식 tspan 유무로 갈림). 수직 정렬은 좌표에 직접.
- `<text>` 의 x/y/rotate 리스트는 자식 tspan 안의 글자까지 순서대로 소비된다(두 엔진 실측) — 진입 스태거용 tspan 분해와 공존한다.
- `getExtentOfChar` 는 회전된 글자에서 축정렬 상자를 준다 — 그 중심으로 경로와의 거리를 재면 3u 쯤 편향. 배치 검증은 픽셀 대조나 이웃 간격 통계로.
- `getPointAtLength` 는 비싸다 — 421 세그먼트 경로에서 호출당 ~0.5ms. 글자마다 부르면 크롬이 8.8초 블록한다. 좁은 창만 훑을 것.
- **포스터 서체는 자체 호스팅 서브셋** `public/fonts/pretendard-poster-subset.woff2` (Pretendard v1.3.9 에서 180자, 가변축 wght 45~930 보존, 35KB, OFL 동봉). CDN 동적 서브셋은 조각 도착 시각이 흔들려 로드마다 다른 화면을 만들었다 — 포스터에는 재사용 금지 (책 제목 등 다른 화면은 종전 CDN 유지).

## 서체 파이프라인

- **SUIT 는 unicode-range 분할 서브셋** (2026-08-17): `public/fonts/suit-v2/SUIT-v2-{base,k1,k2,k3,k4}.woff2` + 자동 생성 CSS `app/suit-subset.css`. **새 글자가 문안에 등장하면 `python3 scripts/gen_suit_subsets.py` 재생성** 필수(안 하면 그 글자만 폴백 서체). 계층 경계·원본 변경 시 스크립트 `VERSION` 도 올릴 것. 구 `SUIT-Variable.woff2` 삭제 금지(구 HTML 참조).
- `/fonts/*` 는 next.config headers() 로 1년 immutable — **서체 파일 내용을 바꾸면 파일명도 바꿀 것**. `next start` 는 이 헤더를 덮어써 로컬 검증 불가(Vercel 엣지에서만 적용).
- **외부 서체 CSS 는 `DeferredCss` 로만** (2026-08-18): `<link rel="stylesheet">` 를 JSX 에 직접 쓰면 CDN 이 느릴 때 첫 페인트 전체가 인질(실측 26초). ⚠ **SUIT 수동 preload 금지** — Next 자동 preload 와 610KB 이중 다운로드가 된다.

## 실제 WebKit(사파리 엔진) 검증 (2026-08-15 신설)

- 설치: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright@latest install webkit` → `apt-get update && npx playwright@latest install-deps webkit`. 드라이버는 **npx 로 받은 playwright-core** (`/opt/node22` 의 playwright 는 webkit 리비전이 달라 못 붙는다).
- ⚠ **웹킷 '흉내'로 검증 금지** — 흉내가 틀린 가정 위에 서 있어 iOS 전용 결함 3건을 통과시킨 사고(DECISIONS 2026-08-15).
- 웹킷 특이점: ① 경로 용량을 넘는 글자는 아예 렌더하지 않는다(textPath 여러 벌+음수 startOffset 기법 성립 안 함) ② `<text>`·`<textPath>` 의 `getComputedTextLength` 는 둘 다 '경로에 실린 만큼' ③ CSS 애니 리스타트 수법(`animation:none` 토글)이 안 먹는다.
- 헤드리스 웹킷은 소프트웨어 렌더 — 프레임 시간(중앙 ~85ms)을 실기기 지표로 쓰지 말 것.
