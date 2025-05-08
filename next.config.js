/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'],
    unoptimized: true
  },
  swcMinify: true,
  // i18n: {
  //   locales: ['tr', 'en'],
  //   defaultLocale: 'tr',
  // },
};

module.exports = nextConfig; 