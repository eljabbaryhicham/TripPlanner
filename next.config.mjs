
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: [
      'genkit',
      '@genkit-ai/google-genai',
      'firebase-admin',
    ],
  },
};

export default nextConfig;
