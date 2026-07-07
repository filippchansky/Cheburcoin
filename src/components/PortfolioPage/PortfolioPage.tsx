'use client';
import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuth';
import Portfolio from '../Portfolio/Portfolio';
import { Spin } from 'antd';

interface PortfolioPageProps {}

const PortfolioPage: React.FC<PortfolioPageProps> = ({}) => {
    const { user, isLoading, initializeAuth } = useAuthStore();

    useEffect(() => {
        const unsubscribe = initializeAuth();
        return () => unsubscribe(); // Отписываемся при размонтировании
    }, [initializeAuth]);

    if (isLoading) {
        return (
            <div className='text-center'>
                <Spin />
            </div>
        )
    }

    return <>{user ? <Portfolio /> : <p>Авторизируйтесь</p>}</>;
};
export default PortfolioPage;
