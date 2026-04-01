const nextConfig = {
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
