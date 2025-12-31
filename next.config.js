/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize for Vercel deployment
  output: 'standalone',
  // Ensure proper handling of environment variables
  env: {
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  },
}

module.exports = nextConfig





