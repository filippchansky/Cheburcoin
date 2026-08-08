import ShareDetail from '@/components/ShareDetail/ShareDetail';
import React from 'react';
import type { Metadata } from 'next';

type Props = {
    params: { slug: string[] };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const ticker = params.slug?.[0] ?? '';
    return { title: ticker };
}

const Page = ({ params }: Props) => {
    const ticker = params.slug?.[0] ?? '';
    return (
        <main>
            <ShareDetail ticker={ticker} />
        </main>
    );
};
export default Page;
