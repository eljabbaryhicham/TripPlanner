/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is a workaround for a known issue with the canary build and some dependencies.
  // It ensures that server-side components can correctly resolve certain packages.
  experimental: {
    serverComponentsExternalPackages: [
      '@genkit-ai/google-genai',
      'firebase-admin',
    ],
  },
};

export default nextConfig;
