'use client';
import ModalAuth from '@/components/Authorization/ModalAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { SmileOutlined } from '@ant-design/icons';
import { Button, Empty, Result } from 'antd';
import Link from 'next/link';
import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../../configs/firebase/config';
import FavoriteItem from './FavoriteItem.tsx/FavoriteItem';
import style from './style.module.scss';

interface FavoritePageProps {}

const FavoritePage: React.FC<FavoritePageProps> = ({}) => {
    const { data: coins } = useFavorites();
    const [openModal, setModalOpen] = useState(false);
    const [user, loading] = useAuthState(auth);

    return (
        <>
            {user ? (
                coins && coins.length === 0 ? (
                    <div className='flex justify-center py-20'>
                        <Empty description='В избранном пока пусто'>
                            <Link href='/cryptocurrency'>
                                <Button type='primary'>Выбрать монеты</Button>
                            </Link>
                        </Empty>
                    </div>
                ) : (
                    <div className={style.wrapper}>
                        {coins?.map((item) => <FavoriteItem key={item} item={item} />)}
                    </div>
                )
            ) : (
                // coins?.map((item) => <FavoriteItem key={item} item={item} />)
                <div className=''>
                    <ModalAuth active={openModal} setActive={setModalOpen} />
                    <Result
                        icon={<SmileOutlined />}
                        title='To save and view your favorites, you need to log in!'
                        extra={
                            <Button type='primary' onClick={() => setModalOpen(true)}>
                                Sign in
                            </Button>
                        }
                    />
                </div>
            )}
        </>
    );
};
export default FavoritePage;
