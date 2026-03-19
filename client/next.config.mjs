/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Monaco Editor needs to be treated as an external resource for workers
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
};

export default nextConfig;

