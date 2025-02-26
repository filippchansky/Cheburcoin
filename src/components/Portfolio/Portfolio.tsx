import { useTbankApi } from '@/store/useTbankApi';
import { CircularProgress } from '@mui/material';
import React, { useEffect } from 'react';
import TinkoffSteper from '../TinkoffStepper/TinkoffSteper';

interface PortfolioProps {}

const Portfolio: React.FC<PortfolioProps> = ({}) => {
    const { token, isLoadingToken, initializeAuthListener, activeAccounts, isLoadingAccounts } =
        useTbankApi();

    console.log(activeAccounts);

    useEffect(() => {
        initializeAuthListener();
    }, []);

    if (isLoadingToken || isLoadingAccounts) {
        return <CircularProgress />;
    }

    if (token && activeAccounts.length) {
        return (
            <>
                <p>токен загружен {token}</p>
                <p>Аккаунты: {activeAccounts}</p>
            </>
        );
    }

    return <TinkoffSteper />;
};
export default Portfolio;
