import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
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
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Marquer node-ssh comme module externe (ne pas bundler)
    if (config.externals) {
      config.externals.push({
        'node-ssh': 'node-ssh',
        'ssh2': 'ssh2'
      });
    } else {
      config.externals = [{
        'node-ssh': 'node-ssh',
        'ssh2': 'ssh2'
      }];
    }
    return config;
  },
};

export default nextConfig;
