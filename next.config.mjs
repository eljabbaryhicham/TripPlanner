
/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: [
            'genkit',
            'firebase-admin'
        ],
    },
};

export default nextConfig;
