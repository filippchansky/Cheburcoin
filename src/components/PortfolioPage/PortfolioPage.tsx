'use client';
import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../configs/firebase/config';
import Portfolio from '../Portfolio/Portfolio';
import { Button, Result, Spin } from 'antd';
import ModalAuth from '../Authorization/ModalAuth';

interface PortfolioPageProps {}

const PortfolioPage: React.FC<PortfolioPageProps> = ({}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [user, loading] = useAuthState(auth);

    const showModal = () => {
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <div className='text-center'>
                <Spin />
            </div>
        );
    }

    return (
        <>
            <ModalAuth active={isModalOpen} setActive={setIsModalOpen} />
            {user ? (
                <Portfolio />
            ) : (
                <Result
                    title='Ошибка доступа'
                    subTitle='Анализ портфеля доступен только авторизованным пользователям, пожалуйста авторизуйтесь'
                    extra={
                        <Button type='primary' key='console' onClick={showModal}>
                            Войти
                        </Button>
                    }
                />
            )}
        </>
    );
};
export default PortfolioPage;
