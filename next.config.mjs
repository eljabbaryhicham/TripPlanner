/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This is required for server-side libraries like Firebase Admin to work correctly.
    serverComponentsExternalPackages: ['firebase-admin'],
  },
};

export default nextConfig;
