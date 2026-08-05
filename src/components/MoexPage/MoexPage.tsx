'use client';
import React from 'react';
import { useShares } from '@/hooks/useShares';
import SharesTableAntd from '../SharesTableAntd/SharesTableAntd';

const MoexPage: React.FC = () => {
    const { data: shares = [], isLoading, isError } = useShares();

    return (
        <div>
            <SharesTableAntd data={shares} loading={isLoading} error={isError} />
        </div>
    );
};
export default MoexPage;
