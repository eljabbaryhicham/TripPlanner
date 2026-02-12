
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This is required for Genkit and Firebase Admin to work with server components.
    serverComponentsExternalPackages: [
      '@genkit-ai/google-genai', 
      'firebase-admin'
    ],
  },
};

export default nextConfig;
