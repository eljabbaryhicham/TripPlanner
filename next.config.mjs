/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is required for Genkit to work properly.
  // It ensures that the 'firebase-admin' package is treated as an external dependency
  // during the server-side build process, preventing bundling errors.
  serverComponentsExternalPackages: ['firebase-admin'],
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
