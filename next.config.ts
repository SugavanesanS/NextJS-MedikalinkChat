import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use temp dir for .next cache to avoid slow network drive warning
  distDir: '.next',
  async rewrites() {
    return [
      {
        source: "/:path*",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;
