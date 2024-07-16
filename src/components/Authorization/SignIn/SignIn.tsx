'use client';
import { Button, Checkbox, Flex, Input, Space, notification } from 'antd';
import React, { useState } from 'react';
import style from './style.module.scss';
import { NotificationPlacement } from 'antd/es/notification/interface';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useFavoriteCoins } from '@/store/FavoriteCoins';

interface SignInProps {
  setActiveModal: Function;
}

const SignIn: React.FC<SignInProps> = ({ setActiveModal }) => {
  const { addCoins } = useFavoriteCoins();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState(false);
  // const [user, loading] = useAuthState(auth);
  const auth = getAuth();
  const [api, contextHolder] = notification.useNotification();

  const openNotification = (placement: NotificationPlacement, type: 'ok' | 'err') => {
    if (type === 'err') {
      api.error({
        message: `Error`,
        description: 'Invalid Email or password, please, try again!',
        placement
      });
    } else if (type === 'ok') {
      api.success({
        message: `Welcome`,
        description: 'Welcome!',
        placement
      });
    }
  };
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        addCoins();
      })
      .catch((error) => {
        const errorCode = error.code;
        openNotification('top', 'err');
        console.log(errorCode);
      });
  };

  return (
    <>
      {contextHolder}

      <form onSubmit={(e) => handleSignIn(e)}>
        <Space direction='vertical'>
          <Input
            status={error ? 'error' : ''}
            value={email}
            placeholder='Basic usage'
            onChange={(e) => {
              setEmail(e.target.value);
              setError(false);
            }}
          />
          <Flex gap={10}>
            <Input.Password
              status={error ? 'error' : ''}
              value={password}
              className={style.input_pass}
              placeholder='input password'
              visibilityToggle={{
                visible: passwordVisible,
                onVisibleChange: setPasswordVisible
              }}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
            />

            <Button
              type='default'
              style={{ width: 80 }}
              onClick={() => setPasswordVisible((prevState) => !prevState)}
            >
              {passwordVisible ? 'Hide' : 'Show'}
            </Button>
          </Flex>
          <Checkbox onChange={() => console.log()}>Remember me</Checkbox>
          <Button type='primary' htmlType='submit'>
            Sign in
          </Button>
        </Space>
      </form>
    </>
  );
};
export default SignIn;
