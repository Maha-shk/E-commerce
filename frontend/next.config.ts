import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker deployment
  output: "standalone",

  // Image optimization configuration
  images: {
    unoptimized: false, // Enable optimization for Docker deployment
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Add trailing slash for better routing
  trailingSlash: false,

  // Base path and asset prefix (empty for root domain deployment)
  basePath: "",
  assetPrefix: "",

  // Environment variables (will be set during build)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  },
};

export default nextConfig;
