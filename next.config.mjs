
/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: [
            '@genkit-ai/google-genai',
            'firebase-admin'
        ],
    },
};

export default nextConfig;
