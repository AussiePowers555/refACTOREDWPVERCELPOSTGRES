import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-only modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        'better-sqlite3': false,
        os: false,
        net: false,
        tls: false,
        child_process: false,
      };
      
      // Exclude server-only lib files from client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/lib/database': false,
        '@/lib/signature-tokens-db': false,
        '@/lib/signature-tokens': false,
      };
    }

    // Ignore better-sqlite3 module entirely in client builds
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push('better-sqlite3');
    }

    return config;
  },
};

export default nextConfig;
