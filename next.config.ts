import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['react-icons'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/api/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '**', // Allow any path for Google user content
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
