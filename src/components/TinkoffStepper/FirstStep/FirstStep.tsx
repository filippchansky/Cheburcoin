import { Box, Button, Typography } from '@mui/material';
import { Input } from 'antd';
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
            <Typography sx={{ mt: 2, mb: 1 }}>Введите токен</Typography>
            <Input
                placeholder='Токен'
                value={token}
                onChange={(e) => setToken(e.target.value)}
            />
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
                <Button onClick={handleNext} disabled={!token.length}>
                    Далее
                </Button>
            </Box>
        </>
    );
};
export default FirstStep;
