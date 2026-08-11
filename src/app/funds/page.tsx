import FundsPage from '@/components/FundsPage/FundsPage';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Фонды',
    description: 'Список биржевых фондов (БПИФ и ETF) Московской биржи'
};

const Page: React.FC = () => {
    return (
        <main>
            <FundsPage />
        </main>
    );
};
export default Page;
