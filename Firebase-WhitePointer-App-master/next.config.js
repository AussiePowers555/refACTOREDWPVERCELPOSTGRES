/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // This will completely ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // This will ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:9015', '127.0.0.1:9015']
    },
  },
  // Vercel deployment optimizations
  poweredByHeader: false,
  generateEtags: false,
  // Bundle optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : undefined,
  },
  // This will help with Node.js module imports in client-side code
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Replace Node.js modules with empty modules when bundling for client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        os: false,
        net: false,
        tls: false,
        child_process: false,
        // SQLite not needed in client bundle
        'better-sqlite3': false,
      };
    }

    // Bundle analyzer (enable with ANALYZE_BUNDLE=true)
    if (process.env.ANALYZE_BUNDLE === 'true') {
      try {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: isServer ? 'server-bundle-analysis.html' : 'client-bundle-analysis.html',
          })
        );
      } catch (e) {
        console.warn('webpack-bundle-analyzer not installed. Run: npm install --save-dev webpack-bundle-analyzer');
      }
    }

    // Optimize chunks for better caching
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            icons: {
              test: /[\\/]node_modules[\\/](lucide-react|@heroicons)[\\/]/,
              name: 'icons',
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;
