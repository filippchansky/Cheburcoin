import { Button, Checkbox, CheckboxProps, Divider } from 'antd';
import React from 'react';
import { IPlainOptions } from '../TinkoffSteper';

const CheckboxGroup = Checkbox.Group;

interface SecondStepProps {
    activeStep: number;
    handleBack: () => void;
    handleNext: () => void;
    checkedList: string[];
    setCheckedList: React.Dispatch<React.SetStateAction<string[]>>;
    plainOptions: IPlainOptions[];
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
            <p className='mb-1 mt-4'>Выберите аккаунт(ы)</p>
            <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
                Check all
            </Checkbox>
            <Divider />
            <CheckboxGroup options={plainOptions} value={checkedList} onChange={onChange} />
            <div className='flex flex-row pt-4'>
                <Button disabled={activeStep === 0} onClick={handleBack} className='mr-2'>
                    Back
                </Button>
                <div className='flex-auto' />
                <Button type='primary' onClick={handleNext} disabled={!checkedList.length}>
                    Далее
                </Button>
            </div>
        </>
    );
};
export default SecondStep;
