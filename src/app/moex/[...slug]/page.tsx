import AboutShares from '@/components/AboutShares/AboutShares';
import MoexChart from '@/components/MoexChart/MoexChart';
import React from 'react';

interface PageProps {}

const Page = ({ params }: { params: { slug: string } }) => {
    return (
        <>
            <AboutShares ticker={params.slug} />
        </>
    );
};
export default Page;
