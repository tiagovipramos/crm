/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Excluir pasta backend do type checking
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
