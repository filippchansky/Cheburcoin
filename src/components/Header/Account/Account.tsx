import { Avatar, Button, Popover } from 'antd';
import style from './style.module.scss';
import SkeletonAvatar from 'antd/es/skeleton/Avatar';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';
import SwitchTeme from '../SwitchTeme/SwitchTeme';
import ModalAuth from '@/components/Authorization/ModalAuth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../../configs/firebase/config';
import { signOut } from 'firebase/auth';
import { useFavoriteCoins } from '@/store/FavoriteCoins';

interface AccountProps {}

const Account: React.FC<AccountProps> = ({}) => {
  const { addCoins } = useFavoriteCoins();
  const [user, loading] = useAuthState(auth);
  // console.log({ user });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handlerSignOut = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.preventDefault();
    signOut(auth);
    addCoins();
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
      {loading && (
        <SkeletonAvatar
          active
          size={50}
          className='flex h-[50px] items-center'
          style={{ backgroundColor: 'rgb(27 28 30)' }}
        />
      )}
      {user && (
        <Popover content={content} title={user.email} trigger='click'>
          <Avatar className='cursor-pointer' src={'https://via.placeholder.com/50'} size={50} />
        </Popover>
      )}
      {!loading && !user && (
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
