import { Button, Checkbox, CheckboxProps, Divider } from 'antd';
import React from 'react';
import { IPlainOptions } from '../TinkoffSteper';

const CheckboxGroup = Checkbox.Group;

interface SecondStepProps {
    handleBack: () => void;
    handleNext: () => void;
    checkedList: string[];
    setCheckedList: React.Dispatch<React.SetStateAction<string[]>>;
    plainOptions: IPlainOptions[];
    loading: boolean;
}

const SecondStep: React.FC<SecondStepProps> = ({
    handleBack,
    handleNext,
    checkedList,
    setCheckedList,
    plainOptions,
    loading
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
            <p className='mb-1 mt-4'>Выберите счёт(а)</p>
            <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
                Выбрать все
            </Checkbox>
            <Divider />
            <CheckboxGroup options={plainOptions} value={checkedList} onChange={onChange} />
            <div className='flex flex-row pt-4'>
                <Button onClick={handleBack} className='mr-2' disabled={loading}>
                    Назад
                </Button>
                <div className='flex-auto' />
                <Button
                    type='primary'
                    onClick={handleNext}
                    disabled={!checkedList.length}
                    loading={loading}
                >
                    Готово
                </Button>
            </div>
        </>
    );
};
export default SecondStep;
