const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: process.env.ENFORCE_LINT_DURING_BUILD !== 'true'
  },
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: '/api/auth/:path*'
      },
      {
        source: '/data/:path*',
        destination: '/api/data/:path*'
      }
    ];
  }
};

export default nextConfig;
