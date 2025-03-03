import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import style from './style.module.scss';
import FirstStep from './FirstStep/FirstStep';
import SecondStep from './SecondStep/SecondStep';
import ThirdStep from './ThirdStep/ThirdStep';
import { useTbankApi } from '@/store/useTbankApi';
import { getAccounts } from '@api/tinkoff/getAccounts/getAccounts';
import { notification } from 'antd';

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

    const isStepOptional = (step: number) => {
        return step === 1;
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
            <Box sx={{ width: '100%' }}>
                <Stepper activeStep={activeStep}>
                    {steps.map((label, index) => {
                        const stepProps: { completed?: boolean } = {};
                        const labelProps: {
                            optional?: React.ReactNode;
                        } = {};
                        labelProps.optional = (
                            <Typography variant='caption'>Обязательно</Typography>
                        );
                        if (isStepOptional(index)) {
                        }
                        if (isStepSkipped(index)) {
                            stepProps.completed = false;
                        }
                        return (
                            <Step key={label} {...stepProps}>
                                <StepLabel {...labelProps}>{label}</StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>
                {activeStep === steps.length ? (
                    <React.Fragment>
                        <Typography sx={{ mt: 2, mb: 1 }}>
                            All steps completed - you&apos;re finished
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                            <Box sx={{ flex: '1 1 auto' }} />
                            <Button onClick={handleReset}>Reset</Button>
                        </Box>
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
            </Box>
        </div>
    );
};
export default TinkoffSteper;
