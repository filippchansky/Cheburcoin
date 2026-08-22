'use client';
import React from 'react';
import { Button, Input, Popconfirm, Popover, Space, Tag, Typography, notification } from 'antd';
import { ApiOutlined, DisconnectOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useBybit, useSetBybitCreds, useDisconnectBybit } from '@/hooks/useBybit';

const { Text, Link } = Typography;

/** Сокращает ключ для показа: AbCd…WxYz. */
const shortKey = (k: string) => (k.length > 12 ? `${k.slice(0, 4)}…${k.slice(-4)}` : k);

/**
 * Тело источника «Криптобиржа (Bybit)» для аккордеона. Логика 1:1 со старой
 * BybitConnectCard, но без Card: правила безопасности вынесены в Popover у полей,
 * а не в крупный Alert.
 */
const BybitPanel: React.FC = () => {
    const { data } = useBybit();
    const setCreds = useSetBybitCreds();
    const disconnect = useDisconnectBybit();
    const [api, contextHolder] = notification.useNotification();

    const [apiKey, setApiKey] = React.useState('');
    const [apiSecret, setApiSecret] = React.useState('');

    // Подтягиваем сохранённый ключ в поле (secret не показываем — только placeholder).
    React.useEffect(() => {
        setApiKey(data?.apiKey ?? '');
        setApiSecret('');
    }, [data?.apiKey]);

    const isConnected = Boolean(data?.apiKey && data?.apiSecret);

    const handleSave = async () => {
        const key = apiKey.trim();
        // Если secret не трогали (поле пустое, а ключ уже сохранён) — оставляем прежний.
        const secret = apiSecret.trim() || (key === data?.apiKey ? data?.apiSecret ?? '' : '');

        if (!key || !secret) {
            api.info({ placement: 'top', message: 'Введите API key и secret' });
            return;
        }

        await setCreds.mutateAsync({ apiKey: key, apiSecret: secret });
        setApiSecret('');
        api.success({ placement: 'top', message: 'Сохранено' });
    };

    return (
        <div className='flex flex-col gap-4'>
            {contextHolder}

            {isConnected && (
                <div>
                    <Text type='secondary'>Подключён ключ:</Text>
                    <div className='mt-2'>
                        <Tag color='gold'>{shortKey(data!.apiKey!)}</Tag>
                    </div>
                </div>
            )}

            <Text type='secondary'>
                Создайте в кабинете Bybit API-ключ с правами только на чтение (Read-only, без Trade и
                Withdraw). Секрет уходит на наш сервер только для подписи запроса — в браузере не
                хранится и не показывается.
            </Text>

            <div className='flex flex-col gap-1'>
                <div className='flex items-center gap-1'>
                    <Text strong>API key</Text>
                    <Popover
                        trigger={['hover', 'click']}
                        content={
                            <div style={{ maxWidth: 260 }}>
                                <div>
                                    Не включайте на ключе IP-ограничение: сервис работает с
                                    динамических адресов, и с whitelist запросы будут отклоняться.
                                    Права ключа держите строго read-only.
                                </div>
                                <div className='mt-1'>
                                    <Link
                                        href='https://www.bybit.com/app/user/api-management'
                                        target='_blank'
                                        rel='noreferrer'
                                    >
                                        Управление API-ключами
                                    </Link>
                                </div>
                            </div>
                        }
                    >
                        <QuestionCircleOutlined
                            className='cursor-help'
                            style={{ color: 'var(--ant-color-text-tertiary, #999)' }}
                        />
                    </Popover>
                </div>
                <Input
                    allowClear
                    value={apiKey}
                    placeholder='Bybit API key'
                    onChange={(e) => setApiKey(e.target.value)}
                />
            </div>

            <div className='flex flex-col gap-1'>
                <Text strong>API secret</Text>
                <Input.Password
                    value={apiSecret}
                    placeholder={
                        isConnected ? 'Сохранён — введите заново для замены' : 'Bybit API secret'
                    }
                    onChange={(e) => setApiSecret(e.target.value)}
                />
            </div>

            <Space>
                <Button
                    type='primary'
                    icon={<ApiOutlined />}
                    loading={setCreds.isPending}
                    onClick={handleSave}
                >
                    Сохранить
                </Button>
                {isConnected && (
                    <Popconfirm
                        title='Отключить Bybit?'
                        description='Сохранённые ключи будут удалены.'
                        okText='Отключить'
                        cancelText='Отмена'
                        okButtonProps={{ danger: true }}
                        onConfirm={() => disconnect.mutate()}
                    >
                        <Button danger icon={<DisconnectOutlined />} loading={disconnect.isPending}>
                            Отключить
                        </Button>
                    </Popconfirm>
                )}
            </Space>
        </div>
    );
};

export default BybitPanel;
