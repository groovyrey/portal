import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['react-icons'],
  allowedDevOrigins: ['192.168.100.81'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/7.x/**',
      },
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
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'books.google.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['192.168.100.81:3000', 'localhost:3000'],
    },
  },
  /* config options here */
};

export default nextConfig;
