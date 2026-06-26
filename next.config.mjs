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
