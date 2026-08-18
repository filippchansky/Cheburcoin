import { useTbank, useDisconnectTbank } from '@/hooks/useTbank';
import { useTrezor } from '@/hooks/useTrezor';
import { Button, Popconfirm, Space, Spin } from 'antd';
import { SettingOutlined, DisconnectOutlined } from '@ant-design/icons';
import React from 'react';
import TinkoffSteper from '../TinkoffStepper/TinkoffSteper';
import TrezorConnectCard from '../Trezor/TrezorConnectCard';
import PortfolioDashboard from './PortfolioDashboard/PortfolioDashboard';

interface PortfolioProps {}

const Portfolio: React.FC<PortfolioProps> = ({}) => {
    const { data, isLoading } = useTbank();
    const { data: trezorAccounts, isLoading: isTrezorLoading } = useTrezor();
    const disconnect = useDisconnectTbank();
    const [settingsOpen, setSettingsOpen] = React.useState(false);

    if (isLoading || isTrezorLoading) {
        return (
            <div className='text-center'>
                <Spin />
            </div>
        );
    }

    const isTbankConnected = Boolean(data?.token && data.accounts.length);
    const hasTrezor = Boolean(trezorAccounts?.length);
    // Дашборд показываем, если подключён ХОТЬ ОДИН источник: Т-Банк или Trezor.
    const isConnected = isTbankConnected || hasTrezor;

    // Мастер подключения: при первом входе (нет токена/счетов) или когда
    // пользователь открыл настройки, чтобы сменить токен/счета.
    if (!isConnected || settingsOpen) {
        return (
            <div className='max-w-[1000px] my-0 mx-[auto] flex flex-col gap-4'>
                <h2 className='text-xl font-medium m-0'>Источники данных</h2>
                <TinkoffSteper onClose={settingsOpen ? () => setSettingsOpen(false) : undefined} />
                <TrezorConnectCard />
            </div>
        );
    }

    return (
        <div className='max-w-[1400px] my-0 mx-[auto]'>
            <div className='flex justify-end mb-4'>
                <Space>
                    <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
                        Настройки подключения
                    </Button>
                    {isTbankConnected && (
                        <Popconfirm
                            title='Отключить Т-Банк?'
                            description='Токен и выбранные счета будут удалены.'
                            okText='Отключить'
                            cancelText='Отмена'
                            okButtonProps={{ danger: true }}
                            onConfirm={() => disconnect.mutate()}
                        >
                            <Button danger icon={<DisconnectOutlined />} loading={disconnect.isPending}>
                                Отключить Т-Банк
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            </div>
            <PortfolioDashboard />
        </div>
    );
};
export default Portfolio;
