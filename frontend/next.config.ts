import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization configuration
  // For Vercel deployment, image optimization is automatic
  // For other platforms, you might need to set a domain or use unoptimized
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Add trailing slash for better routing
  trailingSlash: false,

  // Base path and asset prefix (empty for root domain deployment)
  basePath: "",
  assetPrefix: "",

  // Strict mode for better development experience
  reactStrictMode: true,

  // Environment variables (will be set during build)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
