
/** @type {import('next').NextConfig} */
const nextConfig = {
    // This is required to make Genkit and Firebase Admin work.
    // See: https://genkit.dev/docs/firebase/deployment#nextjs-app-hosting
    experimental: {
        serverComponentsExternalPackages: [
            'genkit',
            'firebase-admin',
            'long'
        ],
    },
};

export default nextConfig;
