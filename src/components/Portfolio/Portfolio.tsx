import { useTbank } from '@/hooks/useTbank';
import { Spin } from 'antd';
import React from 'react';
import TinkoffSteper from '../TinkoffStepper/TinkoffSteper';
import PortfolioList from '../PortfolioList/PortfolioList';

interface PortfolioProps {}

const Portfolio: React.FC<PortfolioProps> = ({}) => {
    const { data, isLoading } = useTbank();

    if (isLoading) {
        return (
            <div className='text-center'>
                <Spin />
            </div>
        );
    }

    if (data?.token && data.accounts.length) {
        return (
            <div className='max-w-[1400px] my-0 mx-[auto]'>
                <PortfolioList />
            </div>
        );
    }

    return <TinkoffSteper />;
};
export default Portfolio;
