/**
 * 레이지클럽 트리 경로 상수 (2026-08-11 분리).
 * 종전에는 Shell.tsx("use client")가 export 했는데, **서버 컴포넌트**(meetings/shop
 * 상세)가 이를 문자열 보간하면 클라이언트 참조 프록시가 찍혀 카트 href 가
 * "function() { throw …" 문자열로 저장되는 잠복 버그가 있었다. 서버·클라이언트
 * 어디서든 안전하도록 지시어 없는 모듈로 분리 (Shell 이 re-export 해 기존 소비자 유지).
 */
/** 레이지클럽 라우트 프리픽스 (2026-08-21 확정 — 프리뷰 졸업).
 *  구 `/preview/lazyclub-4b073000ddec094f` 는 폐기: 더 이상 시안이 아니라서
 *  난수 슬러그를 쓸 이유가 없다. 구 URL 은 미들웨어가 301 로 여기로 보낸다.
 *  ⚠ lazy-club.com 에서는 미들웨어가 **루트 경로**를 이 프리픽스로 rewrite 한다 —
 *  즉 같은 페이지가 lazy-club.com/meetings 와 (북클럽 도메인)/lazyclub/meetings 로
 *  둘 다 열린다. 링크는 이 상수만 쓰면 두 도메인에서 모두 맞는다 */
export const BASE = "/lazyclub"

// 라운드 79: 레이지데이 북클럽은 실도메인 절대 URL. 2026-08-19 — 같은 이유(서버 컴포넌트
// 보간 버그)로 여기로 옮김. Shell.tsx 가 re-export 해 기존 소비자(WorkroomHome 등) 유지.
export const BOOKCLUB_URL = "https://www.lazyday-bookclub.com"
/** 기수별 진열은 북클럽 랜딩의 선정도서 섹션으로 (4기는 랜딩 상단이 곧 모집 화면) */
export const BOOKCLUB_BOOK_URL = `${BOOKCLUB_URL}/#book`

/** 전체보기(홈) 경로 — 트리 루트가 아니라 이름 있는 라우트다 (2026-08-21).
 *  lazy-club.com 에서 프리픽스를 떼면 트리 루트는 `/` 가 되는데 그 자리는 랜딩(coming-soon)
 *  이라 홈이 갈 곳이 없어진다. `all` = 내비 라벨 '전체보기'의 영문 대응어 */
export const HOME = `${BASE}/all`
