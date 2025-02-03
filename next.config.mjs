/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        missingSuspenseWithCSRBailout: false
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'mybroker.storage.bcs.ru'
            }
        ]
    }
};

export default nextConfig;
