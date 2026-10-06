import FutureDetail from '@/components/FutureDetail/FutureDetail';
import React from 'react';
import type { Metadata } from 'next';

type Props = {
    params: { secid: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const secid = params.secid ?? '';
    return { title: secid };
}

const Page = ({ params }: Props) => {
    return (
        <main>
            <FutureDetail secid={params.secid ?? ''} />
        </main>
    );
};
export default Page;
