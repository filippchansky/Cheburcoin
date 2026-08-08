import BondsPage from '@/components/BondsPage/BondsPage';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Облигации',
  description: 'Список облигаций',
};

const Page: React.FC = () => {
    return (
        <main>
            <BondsPage />
        </main>
    );
};
export default Page;
