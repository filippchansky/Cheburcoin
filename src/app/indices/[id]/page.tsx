import IndexDetail from '@/components/IndexDetail/IndexDetail';
import React from 'react';
import type { Metadata } from 'next';

type Props = {
    params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const id = params.id ?? '';
    return { title: id };
}

const Page = ({ params }: Props) => {
    return (
        <main>
            <IndexDetail secid={params.id ?? ''} />
        </main>
    );
};
export default Page;
