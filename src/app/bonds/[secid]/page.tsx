import BondDetail from '@/components/BondDetail/BondDetail';
import React from 'react';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ secid: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { secid } = await params;

  return {
    title: `${secid}`,
  };
}

const Page = ({ params }: { params: { secid: string } }) => {
    return (
        <main>
            <BondDetail secid={params.secid} />
        </main>
    );
};
export default Page;
