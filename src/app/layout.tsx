import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { Inter } from 'next/font/google';
import './globals.scss';
import Header from '@/components/Header/Header';
import Providers from '@/components/Providers/Providers';
import MainLayout from '@/components/MainLayout/MainLayout';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { useDarkTheme } from '@/store/darkTheme';

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
