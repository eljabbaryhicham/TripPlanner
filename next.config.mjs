/** @type {import('next').NextConfig} */
const nextConfig = {
  // The `serverComponentsExternalPackages` option allows you to opt-out of bundling
  // dependencies that are not compatible with the Edge Runtime.
  // @see https://nextjs.org/docs/app/api-reference/next-config-js/serverComponentsExternalPackages
  serverComponentsExternalPackages: [
    '@genkit-ai/google-genai',
    'firebase-admin',
  ],
};

export default nextConfig;
