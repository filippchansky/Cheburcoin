'use client';
import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button, Result, Spin } from 'antd';
import { auth } from '../../../configs/firebase/config';
import ModalAuth from '../Authorization/ModalAuth';
import Budget from './Budget';

/** Раздел «Бюджет» за авторизацией: операции привязаны к пользователю (Firestore). */
const BudgetPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [user, loading] = useAuthState(auth);

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
                <Budget />
            ) : (
                <Result
                    title='Ошибка доступа'
                    subTitle='Учёт расходов и доходов доступен только авторизованным пользователям, пожалуйста авторизуйтесь'
                    extra={
                        <Button type='primary' onClick={() => setIsModalOpen(true)}>
                            Войти
                        </Button>
                    }
                />
            )}
        </>
    );
};
export default BudgetPage;
