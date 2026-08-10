import { useTbank, useDisconnectTbank } from '@/hooks/useTbank';
import { Button, Popconfirm, Space, Spin } from 'antd';
import { SettingOutlined, DisconnectOutlined } from '@ant-design/icons';
import React from 'react';
import TinkoffSteper from '../TinkoffStepper/TinkoffSteper';
import PortfolioDashboard from './PortfolioDashboard/PortfolioDashboard';

interface PortfolioProps {}

const Portfolio: React.FC<PortfolioProps> = ({}) => {
    const { data, isLoading } = useTbank();
    const disconnect = useDisconnectTbank();
    const [settingsOpen, setSettingsOpen] = React.useState(false);

    if (isLoading) {
        return (
            <div className='text-center'>
                <Spin />
            </div>
        );
    }

    const isConnected = Boolean(data?.token && data.accounts.length);

    // Мастер подключения: при первом входе (нет токена/счетов) или когда
    // пользователь открыл настройки, чтобы сменить токен/счета.
    if (!isConnected || settingsOpen) {
        return <TinkoffSteper onClose={settingsOpen ? () => setSettingsOpen(false) : undefined} />;
    }

    return (
        <div className='max-w-[1400px] my-0 mx-[auto]'>
            <div className='flex justify-end mb-4'>
                <Space>
                    <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
                        Настройки подключения
                    </Button>
                    <Popconfirm
                        title='Отключить Т-Банк?'
                        description='Токен и выбранные счета будут удалены.'
                        okText='Отключить'
                        cancelText='Отмена'
                        okButtonProps={{ danger: true }}
                        onConfirm={() => disconnect.mutate()}
                    >
                        <Button danger icon={<DisconnectOutlined />} loading={disconnect.isPending}>
                            Отключить
                        </Button>
                    </Popconfirm>
                </Space>
            </div>
            <PortfolioDashboard />
        </div>
    );
};
export default Portfolio;
