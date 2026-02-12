
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Genkit and Firebase Admin SDK to work correctly in server components.
  experimental: {
    serverComponentsExternalPackages: [
      '@genkit-ai/google-genai',
      'firebase-admin',
    ],
  },
};

export default nextConfig;
