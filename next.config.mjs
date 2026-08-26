/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // 서체는 불변 파일 — 1년 캐시 (2026-08-17, 운영자 "느리면 안되지").
        // ① 기본(max-age=0)이면 재방문마다 610KB(SUIT)를 다시 받는다.
        // ② Next 가 CSS @font-face 를 보고 자동 preload 를 심는데, 하이드레이션 때
        //    같은 힌트를 한 번 더 발화한다 — 캐시가 0 이라 그 재발화가 **같은 로드에서
        //    610KB 를 통째로 두 번** 받게 했다 (실측 33ms·653ms 2회 전송).
        //    캐시를 주면 재발화는 디스크 캐시 히트(전송 0)로 끝난다.
        // ⚠ 이 정책의 계약: **서체 파일 내용을 바꾸면 파일명도 바꾼다** (예:
        //    pretendard-poster-subset.woff2 재생성 시 -v2 부여 + 참조 갱신).
        //    같은 이름으로 덮어쓰면 재방문자가 1년간 옛 파일을 본다.
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ]
  },
  async redirects() {
    return [
      // /lazyday/apply/interview → /lazyday/apply/interview/schedule
      {
        source: '/lazyday/apply/interview',
        destination: '/lazyday/apply/interview/schedule',
        permanent: true,
      },
      // (이름·URL 확정 2026-07-24) 구 /oneday → /one-day-talk-01/apply
      // 북클럽 도메인은 미들웨어 rewrite 전에 redirects가 먼저 돌므로 두 형태 모두 커버
      {
        source: '/oneday',
        destination: '/one-day-talk-01/apply',
        permanent: true,
      },
      {
        source: '/lazyday/oneday',
        destination: '/lazyday/one-day-talk-01/apply',
        permanent: true,
      },
      // (컷오버) linkylounge.com 루트 → /lazyday 리다이렉트 제거 — 이제 루트는 링키라운지 홈을 직접 서빙
      // linkykorea.com 전체 → 레이지클럽(정본 www) — 2026-08-15 목적지 변경.
      // 구 목적지 linkylounge.com/lazyday 는 다시 북클럽으로 301 되던 2단 체인이었다.
      // ⚠ 현재 linkykorea.com 은 이 프로젝트가 아니라 Vercel `linky-homepage`(repo LinkyDev01/testLanding)
      //    에 붙어 있어 이 규칙은 대기 상태다 — 도메인을 이 프로젝트로 옮기면 즉시 유효.
      {
        source: '/:path*',
        destination: 'https://www.lazy-club.com',
        permanent: true,
        has: [{ type: 'host', value: 'linkykorea.com' }],
      },
      {
        source: '/:path*',
        destination: 'https://www.lazy-club.com',
        permanent: true,
        has: [{ type: 'host', value: 'www.linkykorea.com' }],
      },
    ]
  },
}

export default nextConfig
