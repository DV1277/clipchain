/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  webpack: (config) => {
    // pino-pretty is a dev-only dep pulled in by WalletConnect logger — not needed at runtime
    config.resolve.fallback = { ...config.resolve.fallback, 'pino-pretty': false }
    return config
  },
}
module.exports = nextConfig
