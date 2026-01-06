import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: `${process.env.API_GATEWAY_URL || 'http://localhost:8000'}/auth/:path*`,
      },
      {
        source: '/users/:path*',
        destination: `${process.env.API_GATEWAY_URL || 'http://localhost:8000'}/users/:path*`,
      },
    ];
  },
};

export default nextConfig;
