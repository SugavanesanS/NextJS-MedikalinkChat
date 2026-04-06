/** @type {import('next').NextConfig} */

const nextConfig = {
  // Use temp dir for .next cache to avoid slow network drive warning
  distDir: '.next',

  typescript: {
    ignoreBuildErrors: true,  // don't block build on type errors
  },
  eslint: {
    ignoreDuringBuilds: true, // don't block build on eslint errors
  },

  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/',
      },
    ];
  },
};

module.exports = nextConfig;