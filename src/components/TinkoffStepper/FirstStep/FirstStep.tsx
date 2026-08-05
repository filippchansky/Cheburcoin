import { Button, Input } from 'antd';
import React from 'react';

interface FirstStepProps {
    activeStep: number;
    handleBack: () => void;
    handleNext: () => void;
    token: string;
    setToken: React.Dispatch<React.SetStateAction<string>>;
}

const FirstStep: React.FC<FirstStepProps> = ({
    activeStep,
    handleBack,
    handleNext,
    setToken,
    token
}) => {
    return (
        <>
            <p className='mb-1 mt-4'>Введите токен</p>
            <Input placeholder='Токен' value={token} onChange={(e) => setToken(e.target.value)} />
            <div className='flex flex-row pt-4'>
                <Button disabled={activeStep === 0} onClick={handleBack} className='mr-2'>
                    Back
                </Button>
                <div className='flex-auto' />
                <Button type='primary' onClick={handleNext} disabled={!token.length}>
                    Далее
                </Button>
            </div>
        </>
    );
};
export default FirstStep;
