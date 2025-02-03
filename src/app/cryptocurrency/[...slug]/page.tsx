import AboutCurrency from '@/components/Cryptocurrency/About/AboutCurrency';
import React from 'react';

interface PageProps {}

const Page = ({ params }: { params: { slug: string } }) => {
    return <AboutCurrency />;
};
export default Page;
