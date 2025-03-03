'use client';
import { Button, Checkbox, Flex, Input, Space, notification } from 'antd';
import React, { useState } from 'react';
import style from './style.module.scss';
import { NotificationPlacement } from 'antd/es/notification/interface';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useFavoriteCoins } from '@/store/FavoriteCoins';

interface SignInProps {
    setActiveModal: Function;
}

const SignIn: React.FC<SignInProps> = ({ setActiveModal }) => {
    const { addCoins } = useFavoriteCoins();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
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
        setLoading(true);
        signInWithEmailAndPassword(auth, email, password)
            .then((res) => {
                console.log(res)
                localStorage.setItem('firebaseUid', res.user.uid)
                addCoins();
                setLoading(false);
            })
            .catch((error) => {
                const errorCode = error.code;
                openNotification('top', 'err');
                setIsForgotPassword(true);
                setLoading(false);
                console.log(errorCode);
            });
    };

    const handleResetPassword = async () => {
        sendPasswordResetEmail(auth, email).then(() => {
            setActiveModal(false);
            setIsForgotPassword(false);
            api.info({
                message: `Reset password`,
                description: `A password reset email has been sent to ${email}`,
                placement: 'top'
            });
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
                    {isForgotPassword && (
                        <Button onClick={handleResetPassword} type='link'>
                            I forgot my password
                        </Button>
                    )}
                    <Checkbox onChange={() => console.log()}>Remember me</Checkbox>
                    <Button type='primary' htmlType='submit' loading={loading}>
                        Sign in
                    </Button>
                </Space>
            </form>
        </>
    );
};
export default SignIn;
