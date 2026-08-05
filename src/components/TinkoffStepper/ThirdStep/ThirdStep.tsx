import { Button } from 'antd';
import React from 'react';

interface ThirdStepProps {
    activeStep: number;
    handleBack: () => void;
    handleNext: () => void;
}

const ThirdStep: React.FC<ThirdStepProps> = ({ activeStep, handleBack, handleNext }) => {
    return (
        <>
            <p className='mb-1 mt-4'>Готово</p>
            <div className='flex flex-row pt-4'>
                <Button disabled={activeStep === 0} onClick={handleBack} className='mr-2'>
                    Back
                </Button>
                <div className='flex-auto' />
                <Button type='primary' onClick={handleNext}>
                    Далее
                </Button>
            </div>
        </>
    );
};
export default ThirdStep;
