/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Remove X-Powered-By header
  poweredByHeader: false,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  // API body size for file uploads
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },

  images: {
    remotePatterns: [],
    formats: ['image/webp'],
  },
};

module.exports = nextConfig;
