'use client';
import * as React from 'react';
import { Steps, notification } from 'antd';
import FirstStep from '../../TinkoffStepper/FirstStep/FirstStep';
import SecondStep from '../../TinkoffStepper/SecondStep/SecondStep';
import { IPlainOptions } from '../../TinkoffStepper/types';
import { useTbank, useSetTbankToken, useSetTbankAccounts } from '@/hooks/useTbank';
import { getAccounts } from '@api/tinkoff/getAccounts/getAccounts';

interface TbankPanelProps {
    /** Вызывается после успешного сохранения счетов (чтобы свернуть панель). */
    onDone?: () => void;
}

const steps = ['Токен Т-Банка', 'Выбор счетов'];

/**
 * Тело источника «Брокерский счёт (Т-Банк)» для аккордеона SourcesConnect.
 * Логика 1:1 со старым TinkoffSteper, только без внешней Card — заголовок и
 * контейнер даёт строка аккордеона.
 */
const TbankPanel: React.FC<TbankPanelProps> = ({ onDone }) => {
    const { data: tbank } = useTbank();
    const setTbankToken = useSetTbankToken();
    const setTbankAccounts = useSetTbankAccounts();

    const [activeStep, setActiveStep] = React.useState(0);
    const [plainOptions, setPlainOptions] = React.useState<IPlainOptions[]>([]);
    const [checkedList, setCheckedList] = React.useState<string[]>(
        (tbank?.accounts ?? []).map((account) => account.id)
    );
    const [token, setToken] = React.useState<string>(tbank?.token ?? '');
    const [loading, setLoading] = React.useState(false);

    const [api, contextHolder] = notification.useNotification();

    const openErrorNotification = (reason: 'invalid-token' | 'network') => {
        api.error({
            placement: 'top',
            message: reason === 'invalid-token' ? 'Неверный токен' : 'Ошибка соединения',
            description:
                reason === 'invalid-token'
                    ? 'Токен не подошёл. Проверьте, что скопировали его полностью, и попробуйте снова.'
                    : 'Не удалось связаться с сервером. Проверьте подключение к сети и попробуйте снова.'
        });
    };

    const handleTokenNext = async () => {
        setLoading(true);
        try {
            await setTbankToken.mutateAsync(token);
            const result = await getAccounts(token);
            if (!result.ok) {
                openErrorNotification(result.reason);
                return;
            }
            setPlainOptions(result.accounts.map((item) => ({ value: item.id, label: item.name })));
            setActiveStep(1);
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const selectedAccounts = plainOptions
                .filter((item) => checkedList.includes(item.value))
                .map((item) => ({ id: item.value, name: item.label }));
            await setTbankAccounts.mutateAsync(selectedAccounts);
            onDone?.();
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => setActiveStep((prev) => prev - 1);

    return (
        <div>
            {contextHolder}
            <Steps
                size='small'
                current={activeStep}
                items={steps.map((label) => ({ title: label }))}
            />
            {activeStep === 0 && (
                <FirstStep
                    handleNext={handleTokenNext}
                    setToken={setToken}
                    token={token}
                    loading={loading}
                />
            )}
            {activeStep === 1 && (
                <SecondStep
                    handleBack={handleBack}
                    handleNext={handleFinish}
                    checkedList={checkedList}
                    setCheckedList={setCheckedList}
                    plainOptions={plainOptions}
                    loading={loading}
                />
            )}
        </div>
    );
};

export default TbankPanel;
