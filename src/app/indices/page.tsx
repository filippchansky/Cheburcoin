import IndicesPage from '@/components/IndicesPage/IndicesPage';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Индексы',
    description: 'Индексы Московской биржи: основные, отраслевые и облигационные'
};

const Page: React.FC = () => {
    return (
        <main>
            <IndicesPage />
        </main>
    );
};
export default Page;
