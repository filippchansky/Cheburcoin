import { useTbankApi } from '@/store/useTbankApi';
import { Spin } from 'antd';
import React from 'react';
import TinkoffSteper from '../TinkoffStepper/TinkoffSteper';
import PortfolioList from '../PortfolioList/PortfolioList';

interface PortfolioProps {}

const Portfolio: React.FC<PortfolioProps> = ({}) => {
    const { token, isLoadingToken, activeAccounts, isLoadingAccounts } = useTbankApi();

    if (isLoadingToken || isLoadingAccounts) {
        return (
            <div className='text-center'>
                <Spin />
            </div>
        );
    }

    if (token && activeAccounts.length) {
        return (
            <div className='max-w-[1400px] my-0 mx-[auto]'>
                <PortfolioList />
            </div>
        );
    }

    return <TinkoffSteper />;
};
export default Portfolio;
