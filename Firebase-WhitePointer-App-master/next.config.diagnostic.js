/** @type {import('next').NextConfig} */
const nextConfig = {
  // Most minimal configuration
  reactStrictMode: true,
  swcMinify: false, // Disable SWC minification to potentially avoid issues
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TypeScript errors for diagnostic purposes
  },
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during build
  },
}

module.exports = nextConfig
