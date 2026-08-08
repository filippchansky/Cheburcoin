import { Avatar, Button, Popover } from 'antd';
import style from './style.module.scss';
import SkeletonAvatar from 'antd/es/skeleton/Avatar';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';
import SwitchTeme from '../SwitchTeme/SwitchTeme';
import ModalAuth from '@/components/Authorization/ModalAuth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../../configs/firebase/config';
import { signOut } from 'firebase/auth';
import defaultAvatar from '@public/Icon/defaultAvatar.jpg';
import Image from 'next/image';

interface AccountProps {}

const Account: React.FC<AccountProps> = ({}) => {
    const [user, loading] = useAuthState(auth);
    const router = useRouter()
    // console.log({ user });

    const [isModalOpen, setIsModalOpen] = useState(false);
    // До монтирования на клиенте показываем то же, что и сервер (скелет),
    // иначе Firebase может успеть восстановить сессию до гидрации и
    // отрендерить <img> аватара, которого нет в серверном HTML → hydration error.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handlerSignOut = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        signOut(auth);
        localStorage.removeItem('firebaseUid');
        router.push('/');
    };

    const content = (
        <div>
            <Button type='primary' onClick={(e) => handlerSignOut(e)} danger>
                Sign Out
            </Button>
        </div>
    );

    return (
        <div className='flex items-center gap-5'>
            <SwitchTeme />
            {(!mounted || loading) && (
                <SkeletonAvatar
                    active
                    size={50}
                    className='flex h-[50px] items-center'
                    style={{ backgroundColor: 'rgb(27 28 30)' }}
                />
            )}
            {mounted && user && (
                <Popover content={content} title={user.email} trigger='click'>
                    <Image
                        alt='avatar'
                        className='cursor-pointer rounded-[50px]'
                        src={defaultAvatar}
                        width={50}
                        height={50}
                    />
                </Popover>
            )}
            {mounted && !loading && !user && (
                // <h1>qwe</h1>
                <>
                    <Suspense>
                        <Button
                            type='primary'
                            //   onClick={() => signIn("google", { callbackUrl })}
                            onClick={showModal}
                        >
                            Sign In
                        </Button>
                    </Suspense>
                    <ModalAuth active={isModalOpen} setActive={setIsModalOpen} />
                </>
            )}
        </div>
    );
};
export default Account;
