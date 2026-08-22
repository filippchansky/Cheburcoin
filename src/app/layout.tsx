import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import './globals.scss';
import Providers from '@/components/Providers/Providers';
import MainLayout from '@/components/MainLayout/MainLayout';
import SplashHider from '@/components/SplashScreen/SplashHider';

export const metadata: Metadata = {
    applicationName: 'CHEBURCOIN',
    title: 'CHEBURCOIN',
    description: 'Дашборд рынка и портфеля: MOEX, облигации, фонды, крипта',
    appleWebApp: {
        capable: true,
        title: 'Cheburcoin',
        statusBarStyle: 'default'
    },
    icons: {
        icon: '/favicon.ico',
        apple: '/icons/apple-touch-icon.png'
    }
};

export const viewport: Viewport = {
    themeColor: '#635BFF',
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover'
};

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='ru'>
            <body className=''>
                <div id='app-splash' aria-hidden='true'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src='/icons/icon-192.png' alt='' width={96} height={96} />
                    <div className='app-splash__spinner' />
                </div>
                <Providers>
                    <MainLayout>
                        {children}
                        <Analytics />
                    </MainLayout>
                </Providers>
                <SplashHider />
            </body>
        </html>
    );
}
