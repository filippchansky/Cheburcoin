'use client';
import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../configs/firebase/config';
import Portfolio from '../Portfolio/Portfolio';
import { Spin } from 'antd';

interface PortfolioPageProps {}

const PortfolioPage: React.FC<PortfolioPageProps> = ({}) => {
    const [user, loading] = useAuthState(auth);

    if (loading) {
        return (
            <div className='text-center'>
                <Spin />
            </div>
        );
    }

    return <>{user ? <Portfolio /> : <p>Авторизируйтесь</p>}</>;
};
export default PortfolioPage;
