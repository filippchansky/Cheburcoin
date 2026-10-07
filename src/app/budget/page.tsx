import BudgetPage from '@/components/Budget/BudgetPage';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Бюджет',
    description: 'Учёт личных расходов и доходов'
};

const Page: React.FC = () => {
    return (
        <main>
            <BudgetPage />
        </main>
    );
};
export default Page;
