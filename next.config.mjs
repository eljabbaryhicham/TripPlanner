
/** @type {import('next').NextConfig} */
const nextConfig = {
    // This is required for Genkit and Firebase Admin to work correctly in Next.js.
    // It ensures that these server-side libraries are treated as external packages.
    serverComponentsExternalPackages: [
        '@genkit-ai/google-genai',
        'firebase-admin',
    ],
};

export default nextConfig;
