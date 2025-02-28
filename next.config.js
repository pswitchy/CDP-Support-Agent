/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      serverActions: true,
    },
    images: {
      domains: ['segment.com', 'mparticle.com', 'lytics.com', 'zeotap.com'],
    },
  };
  
  module.exports = nextConfig;