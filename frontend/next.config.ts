import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for cPanel deployment - generates HTML/CSS/JS files
  // This allows deployment to traditional web hosting without Node.js
  output: "export",

  // Image optimization configuration for static export
  images: {
    unoptimized: true, // Required for static export
  },

  // Add trailing slash for better static routing
  trailingSlash: true,

  // Base path and asset prefix (empty for root domain deployment)
  basePath: "",
  assetPrefix: "",

  // Environment variables (will be set during build)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://api.cento-servizi.it/api",
  },
};

export default nextConfig;
