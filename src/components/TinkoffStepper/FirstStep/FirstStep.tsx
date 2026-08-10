import { Button, Input } from 'antd';
import React from 'react';

interface FirstStepProps {
    handleNext: () => void;
    token: string;
    setToken: React.Dispatch<React.SetStateAction<string>>;
    loading: boolean;
}

const FirstStep: React.FC<FirstStepProps> = ({ handleNext, setToken, token, loading }) => {
    return (
        <>
            <p className='mb-1 mt-4'>Введите токен Т-Банка</p>
            <Input
                placeholder='Токен'
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onPressEnter={() => token.length && !loading && handleNext()}
            />
            <div className='flex flex-row pt-4'>
                <div className='flex-auto' />
                <Button
                    type='primary'
                    onClick={handleNext}
                    disabled={!token.length}
                    loading={loading}
                >
                    Далее
                </Button>
            </div>
        </>
    );
};
export default FirstStep;
