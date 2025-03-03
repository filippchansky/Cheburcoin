import { useTbankApi } from '@/store/useTbankApi';
import { CircularProgress } from '@mui/material';
import React, { useEffect } from 'react';
import TinkoffSteper from '../TinkoffStepper/TinkoffSteper';
import PortfolioList from '../PortfolioList/PortfolioList';

interface PortfolioProps {}

const Portfolio: React.FC<PortfolioProps> = ({}) => {
    const { token, isLoadingToken, initializeAuthListener, activeAccounts, isLoadingAccounts } =
        useTbankApi();

    useEffect(() => {
        initializeAuthListener();
    }, []);

    if (isLoadingToken || isLoadingAccounts) {
        return (
            <div className='text-center'>
                <CircularProgress />
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
