/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // This is required for Genkit to work correctly with Next.js 14+
        serverComponentsExternalPackages: [
            '@genkit-ai/google-genai',
            'firebase-admin'
        ],
    },
};

export default nextConfig;
