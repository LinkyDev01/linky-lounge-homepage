/**
 * 레이지클럽 트리 경로 상수 (2026-08-11 분리).
 * 종전에는 Shell.tsx("use client")가 export 했는데, **서버 컴포넌트**(meetings/shop
 * 상세)가 이를 문자열 보간하면 클라이언트 참조 프록시가 찍혀 카트 href 가
 * "function() { throw …" 문자열로 저장되는 잠복 버그가 있었다. 서버·클라이언트
 * 어디서든 안전하도록 지시어 없는 모듈로 분리 (Shell 이 re-export 해 기존 소비자 유지).
 */
export const BASE = "/preview/lazyclub-4b073000ddec094f"
