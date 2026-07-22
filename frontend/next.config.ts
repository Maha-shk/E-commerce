import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal self-contained server bundle in `.next/standalone`,
  // which the Docker runtime stage copies for a small production image.
  output: "standalone",
};

export default nextConfig;
