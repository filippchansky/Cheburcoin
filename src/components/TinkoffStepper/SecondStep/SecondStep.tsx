import { Box, Button, Typography } from '@mui/material';
import { Checkbox, CheckboxProps, Divider, Input } from 'antd';
import React from 'react';
import { IPlainOptions } from '../TinkoffSteper';

const CheckboxGroup = Checkbox.Group;

interface SecondStepProps {
    activeStep: number;
    handleBack: () => void;
    handleNext: () => void;
    checkedList: string[];
    setCheckedList: React.Dispatch<React.SetStateAction<string[]>>;
    plainOptions:IPlainOptions[] ;
}

const SecondStep: React.FC<SecondStepProps> = ({
    activeStep,
    handleBack,
    handleNext,
    checkedList,
    setCheckedList,
    plainOptions
}) => {
    const checkAll = plainOptions.length === checkedList.length;
    const indeterminate = checkedList.length > 0 && checkedList.length < plainOptions.length;

    const onChange = (list: string[]) => {
        setCheckedList(list);
    };

    const onCheckAllChange: CheckboxProps['onChange'] = (e) => {
        setCheckedList(e.target.checked ? plainOptions.map((item) => item.value) : []);
    };

    return (
        <>
            <Typography sx={{ mt: 2, mb: 1 }}>Выберите аккаунт(ы)</Typography>
            <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
                Check all
            </Checkbox>
            <Divider />
            <CheckboxGroup options={plainOptions} value={checkedList} onChange={onChange} />
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
                <Button onClick={handleNext} disabled={!checkedList.length}>
                    Далее
                </Button>
            </Box>
        </>
    );
};
export default SecondStep;
