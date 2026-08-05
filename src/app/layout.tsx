import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import './globals.scss';
import Providers from '@/components/Providers/Providers';
import MainLayout from '@/components/MainLayout/MainLayout';

export const metadata: Metadata = {
    title: 'CHEBURCOIN',
    description: ''
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
