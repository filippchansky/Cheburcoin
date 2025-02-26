import { Box, Button, Typography } from '@mui/material';
import { Input } from 'antd';
import React from 'react';

interface ThirdStepProps {
    activeStep: number;
    handleBack: () => void;
    handleNext: () => void;
}

const ThirdStep: React.FC<ThirdStepProps> = ({ activeStep, handleBack, handleNext }) => {
    return (
        <>
            <Typography sx={{ mt: 2, mb: 1 }}>Введите токен</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                <Button
                    color='inherit'
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                >
                    Back
                </Button>
                <Box sx={{ flex: '1 1 auto' }} />
                <Button onClick={handleNext}>
                    Далее
                </Button>
            </Box>
        </>
    );
};
export default ThirdStep;
