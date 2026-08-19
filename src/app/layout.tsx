import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import './globals.scss';
import Providers from '@/components/Providers/Providers';
import MainLayout from '@/components/MainLayout/MainLayout';

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
                <Providers>
                    <MainLayout>
                        {children}
                        <Analytics />
                    </MainLayout>
                </Providers>
            </body>
        </html>
    );
}
