/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@explobook/shared', '@explobook/ui'],
  reactStrictMode: true,
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiBase}/api/v1/:path*`,
      },
      {
        source: '/health',
        destination: `${apiBase}/health`,
      },
    ];
  },
};

export default nextConfig;
