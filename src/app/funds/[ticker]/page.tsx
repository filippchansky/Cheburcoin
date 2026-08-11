import FundDetail from '@/components/FundDetail/FundDetail';
import React from 'react';
import type { Metadata } from 'next';

type Props = {
    params: { ticker: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const ticker = params.ticker ?? '';
    return { title: ticker };
}

const Page = ({ params }: Props) => {
    return (
        <main>
            <FundDetail ticker={params.ticker ?? ''} />
        </main>
    );
};
export default Page;
