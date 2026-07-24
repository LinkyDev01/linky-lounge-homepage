/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
      // linkykorea.com 전체 → linkylounge.com/lazyday
      {
        source: '/:path*',
        destination: 'https://linkylounge.com/lazyday',
        permanent: true,
        has: [{ type: 'host', value: 'linkykorea.com' }],
      },
      {
        source: '/:path*',
        destination: 'https://linkylounge.com/lazyday',
        permanent: true,
        has: [{ type: 'host', value: 'www.linkykorea.com' }],
      },
    ]
  },
}

export default nextConfig
