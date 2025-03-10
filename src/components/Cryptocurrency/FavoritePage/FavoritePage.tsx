'use client';
import ModalAuth from '@/components/Authorization/ModalAuth';
import { useFavoriteCoins } from '@/store/FavoriteCoins';
import { SmileOutlined } from '@ant-design/icons';
import { Button, Result } from 'antd';
import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../../configs/firebase/config';
import FavoriteItem from './FavoriteItem.tsx/FavoriteItem';
import style from './style.module.scss';

interface FavoritePageProps {}

const FavoritePage: React.FC<FavoritePageProps> = ({}) => {
    const { coins } = useFavoriteCoins();
    const [openModal, setModalOpen] = useState(false);
    const [user, loading] = useAuthState(auth);

    return (
        <>
            {user ? (
                <div className={style.wrapper}>
                    {coins?.map((item) => <FavoriteItem key={item} item={item} />)}
                </div>
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
