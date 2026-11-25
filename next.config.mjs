/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: '.',
  },
  // Allow phone/LAN + custom host access during local development
  allowedDevOrigins: [
    '192.168.0.4',
    'devb2b.prosessed.com',
    '*.ngrok-free.dev',
    '*.ngrok-free.app',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // Applying CORS headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://store.prosessed.com',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
        ],
      },
    ]
  },
}

export default nextConfig
