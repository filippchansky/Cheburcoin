/** @type {import('next').NextConfig} */
const nextConfig = {
    // Самодостаточная сборка для запуска на своём сервере (VPS):
    // next build кладёт в .next/standalone/ мини-server.js + только нужные
    // node_modules. Копируем эту папку на VPS и запускаем `node server.js`.
    output: 'standalone',
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
