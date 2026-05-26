/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: '.',
  },
  experimental: {
  },
  webpack: (config, { dev }) => {
    if (!dev && config.optimization && config.optimization.minimizer) {
      // Disable parallel minification to prevent SIGBUS/Bus error in restricted shm environments
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer.options && minimizer.options.parallel !== undefined) {
          minimizer.options.parallel = false;
        }
      });
    }
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
