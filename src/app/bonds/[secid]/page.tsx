import BondDetail from '@/components/BondDetail/BondDetail';
import React from 'react';

const Page = ({ params }: { params: { secid: string } }) => {
    return (
        <main>
            <BondDetail secid={params.secid} />
        </main>
    );
};
export default Page;
