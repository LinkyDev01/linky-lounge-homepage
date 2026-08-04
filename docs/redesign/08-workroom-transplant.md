# 워크룸 이식 명세 (실측 완료본, 2026-08-04)

목적: workroompress.kr 홈의 구조·수치를 실측해 이 문서를 완성한다.
방법: curl로 홈 HTML + 링크된 CSS 수취 → 아래 항목 기입. 눈대중 금지.
이식 원칙: 구조·수치 차용 / 메뉴명·콘텐츠·이미지·문구는 전부 레이지데이 고유.

실측 출처: 홈 HTML + `generatepress_child/assets/css/style.css`(주 커스텀 92KB) +
`generatepress/assets/css/main.min.css` + 커스터마이저 CSS + `assets/js/basic.js`(Swiper 설정).
Chromium이 프록시 CONNECT 불통이라 자산 143종을 로컬 미러링해 1280·390 렌더 캡처 및
computed 실측 완료.

## 확인된 구조 (HTML 실취득분, 2026-08-04)

- 내비: workroom press / books / texts / shop | search / login / cart
  — 소문자, 텍스트 링크, 보더 버튼 없음
- 홈: 히어로 없음. [books] 라벨 → 표지 이미지 12장 행(링크는 이미지 단독) →
  [texts] 라벨 → 항목(카테고리 소라벨 notice/documents/sounds + 제목) →
  [shop] 라벨 → 품목(카테고리 + 품명 + 가격) → 푸터
- 푸터: 로고 SVG / 국·영문 소개 문단 / 사업자 정보·약관 링크 / 주소·연락처 /
  SNS 아이콘. 기술 스택: WordPress + WooCommerce
- texts의 notice가 공지 채널 — "모집 공고 = notice 항목" 매핑의 원문 근거
- texts 항목에는 실제로 3:4 썸네일이 있음(figure, 2/5 폭) — 레이지데이 1차는
  03 결정대로 미노출(스키마 예약)하는 **의도적 차이**

## 실측값

### 서체 스택

- 원문: `font-family:"mysteria",sans-serif` — 자체 S3 호스팅 커스텀 OTF
  (Mysteria-Regular.otf=400 / Mysteria-Bold.otf=600). 공개 배포·판매처 확인 불가,
  눈누 질의(#25593) 답변 기준 박진현 '지백' 추정 = **유료·비공개 판정**.
- 보조 세리프: `"eulyoo"` = 을유1945 — 상품 상세 `.serif` 전용, **홈 미사용**.
- **대체 채택: Pretendard (400/600)** — 인상 최근접 무료 국문 고딕(중립
  네오그로테스크, 소크기 조판 안정). 프로젝트에 CDN 로드 선례 있음
  (책 제목 Pretendard Variable). 프리뷰 트리 layout에서 로드.

### 크기·행간 (단일 스케일 — 임의 발명 금지)

| 자리 | 크기/행간/굵기 |
|---|---|
| body 기본(내비·라벨·본문·푸터·가격 전부) | **13.2px / 1.5 (19.8px) / 400** |
| 리스트 제목 (`ts-item__title`) | **18px / 1.5 (27px) / 400** |
| 리스트 카테고리 라벨 | 13.2px / **line-height 1** / 400, 제목과 간격 6px(bottom 3px+margin 3px) |
| 푸터 영문 문단만 | 13.2px / **1.25** |
| 섹션 라벨(books ↗ 등) | 13.2px / 400 소문자 + ↗ svg 8×8(margin-left 4px, top 1px) |

굵기 600은 홈에서 실사용처 없음(로드만). word-break keep-all 전역.

### 색

- 배경 **#fff** / 잉크 **#000**(순흑) — 텍스트·괘선·도트 전부 동일
- 보조 회색: 캐러셀 슬라이드 바탕 **#e8e7e6**, input placeholder #bcbcbc
- 링크·호버: 색 변화 없음. 호버 = **underline, offset 4.5px, thickness 0.8px**
  (현재 페이지 메뉴 항목은 동일 밑줄 상시). 섹션 라벨 호버만 border-bottom
  1px solid #000 + padding-bottom 3px 방식
- 유채색 UI 0건 — 색은 콘텐츠 이미지에서만 (02 규율의 원문 근거 확인)

### 레이아웃

- 컨테이너 **max-width 없음(전폭)**, 좌우 마진 **15px**
  (`.site-content{padding:0 15px}`, 헤더·푸터 동일)
- 헤더: **position fixed** top, bg #fff, padding **10px 15px**, 실측 높이
  **40.8px**. 본문 시작 `.site-content` padding-top **39px**
- 기본 그리드: **15컬럼 1fr, gap 15px** (헤더·푸터). 헤더 배치: 좌측 메뉴
  1/5(flex gap 15px), 검색 5/11(평시 width 0), 우측 메뉴 11/16(flex gap 15px)
- 홈 texts·shop 병치: 컨테이너 15컬럼 **column-gap 14px**, texts `1/-6`(10칸)
  + shop `-6/-1`(5칸) = **2:1** (1280 실측 835.7px : 407.3px / 전체 1250px)
- 세로 괘선: texts에 **border-right 1px solid #000** + padding-right 7px
  (+width 7px 보정) — 괘선 좌우 여백 ≈ 7px / 14px(gap)
- texts 리스트 내부: **2열**, column-gap 14px

### 괘선

- 리스트 항목: **border-bottom 1px solid #000** (마지막 행 항목은 제거).
  03의 '항목 상단 괘선' 서술과 달리 원문은 **하단선** — 원문 방식 채택
  (시각 결과 동일: 항목 사이 선, 리스트 최상·최하단 무선)
- 푸터: **border-top 1px solid #000**, footer padding **6px 0 40px**
- 섹션 사이 괘선 없음 — 여백·라벨만으로 구분

### 리스트 항목 내부 (ts-item)

- **5컬럼 grid, gap 15px**, padding **7.5px 0**, row-gap 0
- 썸네일 figure: 컬럼 1/3(2/5 폭), **aspect-ratio 3/4**, object-fit cover
  — 레이지데이 1차 미노출(스키마 예약)
- 콘텐츠: 컬럼 3/6, flex column, **justify-content space-between**, gap 15px
- shop 품목: 이미지 1/4(3/5 폭) + 콘텐츠 4/6, 가격은 품명 아래 margin-top 9px
- 모바일(≤720): 항목 grid **1fr 1fr** (썸네일 좌 절반)

### 캐러셀 (books)

- Swiper 12: `slidesPerView:"auto"`, `spaceBetween:15`, speed **1000ms**,
  autoplay **2000ms**(disableOnInteraction:false), 도트 clickable
- 데스크톱: wrapper 높이 **400px 고정**, 슬라이드 **width auto**(표지 실판형
  비율 유지, img height 100%/width auto), 슬라이드 바탕 #e8e7e6,
  **풀블리드**(width calc(100%+30px) + left -15px, 슬라이드 영역 padding 0 15px)
- 라벨: padding-left 15px(풀블리드 보정), margin-bottom **14px**
- 도트: **8×8px** 원형 #000, 비활성 **opacity .4** / 활성 1, gap **8px**,
  중앙 정렬, 캐러셀과의 간격 **padding-top 25px** (position static)
- 모바일(≤720): **aspect-ratio 1:1**, 슬라이드 1장 풀폭, img object-fit
  contain, 섹션 하단 margin **65px**, 라벨 margin-bottom **25px**
- 데스크톱 books→texts 간격: margin 0 — 도트 영역(25px 패딩+8px)이 간격 전부

### 반응형

- 브레이크포인트 **단일 720px** (보조 850/1090은 홈 무관 요소)
  — **768은 데스크톱 구성 유지**. 03의 "768: shop 하단 이동" 서술은 원문과
  다름 → 원문 방식 채택 (03 스스로 "실측과 대조해 조정" 예정 조항)
- ≤720 해제: 기본 그리드 15→**4컬럼**(gap 15→10) / texts 전폭 1열(세로 괘선
  제거, 항목 하단선 유지) / shop 전폭 **가로 스와이프**(slidesPerView **1.3**,
  spaceBetween 15, loop+autoplay, 도트) / 헤더는 좌 워드마크 + 우 "menu"
  텍스트 트리거 → 드롭다운(box-shadow 0 0 20px 5px rgba(0,0,0,.3), row-gap 25px)

### 여백 리듬

- 라벨→콘텐츠: **14px** 공통 (모바일 books만 25px)
- 리스트 행 높이: 고정값 없음 — 콘텐츠(썸네일 3:4) + padding 7.5px 0 자율
- 푸터 위 여백: 마지막 리스트 항목이 무선으로 끝나고 곧바로 footer
  border-top — 별도 여백 없음

### 푸터 (15컬럼 배치)

- 로고 1/2(absolute top 11px) / 국문 소개 2/4 / 영문 소개 4/6(lh 1.25) /
  사업자 8/11(하단 약관 리스트, 블록 사이 margin 18px) / 연락처 11/16
  (주소·전화·메일 + SNS 아이콘 14px, gap 4px, margin-top 8px)
- 모바일: 4컬럼 grid에서 각 블록 grid-column 2/5 세로 스택(로고 1컬럼 유지)

## 원본 대비 의도적 차이 (03·01 결정 반영 — 대조 시 차이로 세지 않음)

1. ~~texts 항목 썸네일 미노출~~ → **1차부터 노출** (운영자 2026-08-04 "이미지
   다 넣어봐" — 원문과 같은 2/5 폭·3:4 문법으로 장착)
2. login·cart 미노출 — search만 (기능 없는 메뉴 금지)
3. 자동재생 없음 — 02 v3 모션 범위(캐러셀 조작만), 골격 승인 전 이연
4. 서체: Pretendard 대체(원문 커스텀 OTF 유료·비공개) + **명조 혼용**
   (Noto Serif KR 500 — 리스트 제목·푸터 브랜드 문단, 운영자 2026-08-04.
   원문은 고딕 단일이나 랜딩의 고딕·명조 밸런싱 문법을 우선)
5. 콘텐츠·메뉴명·자산 전부 레이지데이 고유

## 대조 루프 규약

1. 원본 1280px·390px 풀페이지 캡처 확보 ✔ (로컬 미러 렌더)
2. 구현 스크린샷과 나란히 붙인 대조 이미지 생성 + 차이 자가 리포트
   (항목: 밀도 / 괘선 / 라벨 / 여백 / 캐러셀 / 병치 구조)
3. 채팅 검수 → 수치 단위 보정 지시 → 재렌더. 2~3회 반복이 기본
