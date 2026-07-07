import * as React from 'react';
import FirstStep from './FirstStep/FirstStep';
import SecondStep from './SecondStep/SecondStep';
import ThirdStep from './ThirdStep/ThirdStep';
import { useTbankApi } from '@/store/useTbankApi';
import { getAccounts } from '@api/tinkoff/getAccounts/getAccounts';
import { Button, notification, Steps } from 'antd';

interface TinkoffSteperProps {}

export interface IPlainOptions {
    value: string;
    label: string;
}

const steps = ['Получите и введите токен Т-Банка', 'Выберите счет', 'Готово'];

const TinkoffSteper: React.FC<TinkoffSteperProps> = ({}) => {
    const [plainOptions, setPlainOptions] = React.useState<IPlainOptions[]>([]);
    const [activeStep, setActiveStep] = React.useState(0);
    const [checkedList, setCheckedList] = React.useState<string[]>([]);
    const [skipped, setSkipped] = React.useState(new Set<number>());
    const { addToken, token: tbankToken, addAccounts } = useTbankApi();
    const [token, setToken] = React.useState<string>(tbankToken ?? '');
    const [api, contextHolder] = notification.useNotification();

    const openNotificationWithIcon = () => {
        api.error({
            placement: 'top',
            message: 'Неверный токен',
            description: 'Токен не валиден, попробуйте заново!'
        });
    };

    const isStepSkipped = (step: number) => {
        return skipped.has(step);
    };

    const handleNext = async () => {
        let newSkipped = skipped;
        if (isStepSkipped(activeStep)) {
            newSkipped = new Set(newSkipped.values());
            newSkipped.delete(activeStep);
        }

        setSkipped(newSkipped);

        if (activeStep === 0) {
            await addToken(token);
            localStorage.setItem('tinkoffToken', token);
            const data = await getAccounts();
            if (data === null) {
                openNotificationWithIcon();
                return;
            }
            const options = data.map((item) => ({
                value: item.id,
                label: item.name
            }));
            setPlainOptions(options);
        }
        if (activeStep === 1) {
            const qwe = plainOptions
                .filter((item) => checkedList.includes(item.value))
                .map((item) => ({
                    id: item.value,
                    name: item.label
                }));
            console.log(qwe);
            addAccounts(qwe);
        }
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
    };

    return (
        <div className='max-w-[1000px] my-0 mx-[auto]'>
            {contextHolder}
            <div className='w-full'>
                <Steps current={activeStep} items={steps.map((label) => ({ title: label }))} />
                {activeStep === steps.length ? (
                    <React.Fragment>
                        <p className='mb-1 mt-4'>All steps completed - you&apos;re finished</p>
                        <div className='flex flex-row pt-4'>
                            <div className='flex-auto' />
                            <Button onClick={handleReset}>Reset</Button>
                        </div>
                    </React.Fragment>
                ) : (
                    <>
                        {activeStep === 0 && (
                            <FirstStep
                                activeStep={activeStep}
                                handleBack={handleBack}
                                handleNext={handleNext}
                                setToken={setToken}
                                token={token}
                            />
                        )}
                        {activeStep === 1 && (
                            <SecondStep
                                activeStep={activeStep}
                                handleBack={handleBack}
                                handleNext={handleNext}
                                checkedList={checkedList}
                                setCheckedList={setCheckedList}
                                plainOptions={plainOptions}
                            />
                        )}
                        {activeStep === 2 && (
                            <ThirdStep
                                activeStep={activeStep}
                                handleBack={handleBack}
                                handleNext={handleNext}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
export default TinkoffSteper;
