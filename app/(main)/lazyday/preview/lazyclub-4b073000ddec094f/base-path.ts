/**
 * 레이지클럽 트리 경로 상수 (2026-08-11 분리).
 * 종전에는 Shell.tsx("use client")가 export 했는데, **서버 컴포넌트**(meetings/shop
 * 상세)가 이를 문자열 보간하면 클라이언트 참조 프록시가 찍혀 카트 href 가
 * "function() { throw …" 문자열로 저장되는 잠복 버그가 있었다. 서버·클라이언트
 * 어디서든 안전하도록 지시어 없는 모듈로 분리 (Shell 이 re-export 해 기존 소비자 유지).
 */
export const BASE = "/preview/lazyclub-4b073000ddec094f"

// 라운드 79: 레이지데이 북클럽은 실도메인 절대 URL. 2026-08-19 — 같은 이유(서버 컴포넌트
// 보간 버그)로 여기로 옮김. Shell.tsx 가 re-export 해 기존 소비자(WorkroomHome 등) 유지.
export const BOOKCLUB_URL = "https://www.lazyday-bookclub.com"
/** 기수별 진열은 북클럽 랜딩의 선정도서 섹션으로 (4기는 랜딩 상단이 곧 모집 화면) */
export const BOOKCLUB_BOOK_URL = `${BOOKCLUB_URL}/#book`
