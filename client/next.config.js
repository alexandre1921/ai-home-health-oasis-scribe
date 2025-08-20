/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // In production behind a reverse proxy set this to true
  // For API requests, the client uses NEXT_PUBLIC_API_URL env var
};

module.exports = nextConfig;