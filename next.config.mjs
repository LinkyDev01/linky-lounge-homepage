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
      // linkylounge.com 루트 → /lazyday
      {
        source: '/',
        destination: '/lazyday',
        permanent: true,
        has: [{ type: 'host', value: 'linkylounge.com' }],
      },
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
