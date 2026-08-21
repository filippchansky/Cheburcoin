'use client';
import React from 'react';
import { Alert, Button, Card, Input, Popconfirm, Space, Tag, Typography, notification } from 'antd';
import { DisconnectOutlined, SafetyOutlined, ApiOutlined } from '@ant-design/icons';
import { useBybit, useSetBybitCreds, useDisconnectBybit } from '@/hooks/useBybit';

const { Text, Link } = Typography;

/** Сокращает ключ для показа: AbCd…WxYz. */
const shortKey = (k: string) => (k.length > 12 ? `${k.slice(0, 4)}…${k.slice(-4)}` : k);

const BybitConnectCard: React.FC = () => {
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
        <Card
            title={
                <Space>
                    <ApiOutlined />
                    Криптобиржа (Bybit)
                </Space>
            }
        >
            {contextHolder}

            <div className='flex flex-col gap-4'>
                {isConnected && (
                    <div>
                        <Text type='secondary'>Подключён ключ:</Text>
                        <div className='mt-2'>
                            <Tag color='gold'>{shortKey(data!.apiKey!)}</Tag>
                        </div>
                    </div>
                )}

                <Text type='secondary'>
                    Создайте в кабинете Bybit <b>API-ключ с правами только на чтение</b> (Read-only,
                    без Trade и Withdraw). Секрет уходит на наш сервер только для подписи запроса —
                    в браузере не хранится и не показывается.
                </Text>

                <div className='flex flex-col gap-1'>
                    <Text strong>API key</Text>
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
                        placeholder={isConnected ? 'Сохранён — введите заново для замены' : 'Bybit API secret'}
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
                            <Button
                                danger
                                icon={<DisconnectOutlined />}
                                loading={disconnect.isPending}
                            >
                                Отключить
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            </div>

            <div className='mt-4'>
                <Alert
                    type='warning'
                    showIcon
                    icon={<SafetyOutlined />}
                    message={
                        <span>
                            Не включайте <b>IP-ограничение</b> на ключе — сервис работает с
                            динамических адресов, и с whitelist запросы будут отклоняться. Права
                            ключа держите строго read-only.{' '}
                            <Link
                                href='https://www.bybit.com/app/user/api-management'
                                target='_blank'
                                rel='noreferrer'
                            >
                                Управление API-ключами
                            </Link>
                        </span>
                    }
                />
            </div>
        </Card>
    );
};
export default BybitConnectCard;
