/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required by Genkit for server-side code
  serverComponentsExternalPackages: [
    '@genkit-ai/google-genai',
    'firebase-admin',
  ],
};

export default nextConfig;
