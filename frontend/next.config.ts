import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Handle PDF.js worker
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  // Allow PDF.js to work properly
  experimental: {
    turbo: {
      resolveAlias: {
        canvas: false,
      },
    },
  },
};

export default nextConfig;
