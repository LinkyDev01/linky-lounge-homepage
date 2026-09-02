/**
 * 도메인 역할표 — 단일 출처 (2026-09-02, 관리 호스트 분리 때 신설).
 *
 *   linkylounge.com          라운지(별도 트리)
 *   lazy-club.com            상위 브랜드 · 회원 본진 (레이지클럽 트리)
 *   lazyday-bookclub.com     북클럽 프로그램 (`/lazyday/**`)
 *   admin.lazy-club.com      관리 화면 전용 — 여기서만 `/admin/*` 이 열린다
 *   linkykorea.com           법인 도메인 — 다른 프로젝트, 이 앱과 무관
 *
 * 규칙: **관리·회원·인증은 lazy-club.com 계열에서만.** (운영자 2026-09-02 브랜드 위계)
 * ⚠ middleware.ts 는 Edge 에서 돌므로 이 파일엔 상수만 둔다 — Node 전용 import 금지.
 */

/** 북클럽 정본 오리진 — 손님에게 보내는 절대 링크(재진입 링크·테스트 진입)는 이 값으로.
 *  관리 화면은 다른 호스트에서 뜨므로 `window.location.origin` 을 쓰면 관리 주소가 새어 나간다 */
export const BOOKCLUB_ORIGIN = "https://www.lazyday-bookclub.com"

/** 관리 호스트 — 손님 도메인의 `/admin*` 은 전부 여기로 307 */
export const ADMIN_HOST = "admin.lazy-club.com"
export const ADMIN_ORIGIN = `https://${ADMIN_HOST}`
