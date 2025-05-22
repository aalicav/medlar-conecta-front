/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  basePath: '/conecta',
  distDir: process.env.NEXT_PUBLIC_CONFIG === 'prod' ? '.next-prod' : '.next-dev',
}

export default nextConfig
