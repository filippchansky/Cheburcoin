import FuturesPage from '@/components/FuturesPage/FuturesPage';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Фьючерсы',
    description: 'Фьючерсы срочного рынка Московской биржи (FORTS): валюта, индексы, товары и акции'
};

const Page: React.FC = () => {
    return (
        <main>
            <FuturesPage />
        </main>
    );
};
export default Page;
