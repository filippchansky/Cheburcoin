'use client';
import React from 'react';
import { Alert, Button, Card, Checkbox, Popconfirm, Space, Tag, Typography, notification } from 'antd';
import { DisconnectOutlined, SafetyOutlined, UsbOutlined } from '@ant-design/icons';
import { ITrezorAccount } from '@models/trezor';
import { TREZOR_COINS } from '@/lib/trezor/coins';
import { connectTrezor } from '@/lib/trezor/discover';
import { useTrezor, useSetTrezorAccounts, useDisconnectTrezor } from '@/hooks/useTrezor';

const { Text } = Typography;

const COIN_OPTIONS = TREZOR_COINS.map((coin) => ({
    label: `${coin.name} (${coin.key})`,
    value: coin.key
}));
const ALL_KEYS = TREZOR_COINS.map((coin) => coin.key);

/** Сокращает дескриптор для показа: xpub6C…dyUhrx. */
const shortDescriptor = (d: string) => (d.length > 16 ? `${d.slice(0, 8)}…${d.slice(-6)}` : d);

interface TrezorConnectCardProps {}

const TrezorConnectCard: React.FC<TrezorConnectCardProps> = ({}) => {
    const { data: accounts = [] } = useTrezor();
    const setTrezor = useSetTrezorAccounts();
    const disconnect = useDisconnectTrezor();
    const [checked, setChecked] = React.useState<string[]>(ALL_KEYS);
    const [loading, setLoading] = React.useState(false);
    const [api, contextHolder] = notification.useNotification();

    const isConnected = accounts.length > 0;

    const handleConnect = async () => {
        if (!checked.length) return;
        setLoading(true);
        try {
            const { accounts: fetched, failed, cancelled } = await connectTrezor(checked);

            if (cancelled) {
                api.info({ placement: 'top', message: 'Подключение отменено' });
                return;
            }
            if (!fetched.length) {
                api.error({
                    placement: 'top',
                    message: 'Не удалось получить данные',
                    description: 'Проверьте, что устройство подключено и разблокировано.'
                });
                return;
            }

            // Мерджим с уже подключёнными: переподключённые монеты обновляем,
            // остальные (не выбранные сейчас) сохраняем.
            const map = new Map<string, ITrezorAccount>(accounts.map((a) => [a.coin, a]));
            fetched.forEach((a) => map.set(a.coin, a));
            await setTrezor.mutateAsync(Array.from(map.values()));

            if (failed.length) {
                api.warning({
                    placement: 'top',
                    duration: 0,
                    message: 'Часть монет не подключилась',
                    description: (
                        <div>
                            <div>Остальные добавлены. Причина по монетам:</div>
                            {failed.map((f) => (
                                <div key={f.coin}>
                                    <b>{f.coin}</b>: {f.error}
                                </div>
                            ))}
                        </div>
                    )
                });
            } else {
                api.success({ placement: 'top', message: 'Trezor подключён' });
            }
        } catch (error) {
            // Ошибка инициализации SDK / связи с устройством (не отмена).
            api.error({
                placement: 'top',
                message: 'Ошибка Trezor',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Не удалось связаться с устройством. Нужен Chrome/Chromium с WebUSB.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            className='mt-6'
            title={
                <Space>
                    <UsbOutlined />
                    Аппаратный кошелёк Trezor
                </Space>
            }
        >
            {contextHolder}

            {isConnected ? (
                <div className='flex flex-col gap-3'>
                    <div>
                        <Text type='secondary'>Подключённые счета:</Text>
                        <div className='mt-2 flex flex-wrap gap-2'>
                            {accounts.map((account) => (
                                <Tag key={account.coin} color='volcano'>
                                    {account.label} · {shortDescriptor(account.descriptor)}
                                </Tag>
                            ))}
                        </div>
                    </div>
                    <div>
                        <Text type='secondary' className='block mb-2'>
                            Переподключить, чтобы добавить монеты или обновить дескрипторы:
                        </Text>
                        <Checkbox.Group
                            options={COIN_OPTIONS}
                            value={checked}
                            onChange={(v) => setChecked(v as string[])}
                        />
                    </div>
                    <Space>
                        <Button
                            type='primary'
                            icon={<UsbOutlined />}
                            loading={loading}
                            disabled={!checked.length}
                            onClick={handleConnect}
                        >
                            Переподключить
                        </Button>
                        <Popconfirm
                            title='Отключить Trezor?'
                            description='Сохранённые дескрипторы будут удалены.'
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
            ) : (
                <div className='flex flex-col gap-3'>
                    <Text type='secondary'>
                        Подключите Trezor, чтобы видеть крипто-баланс в общем портфеле. Приватные
                        ключи остаются на устройстве — сохраняется только публичный дескриптор
                        (read-only: показывает баланс, но не позволяет тратить).
                    </Text>
                    <Checkbox.Group
                        options={COIN_OPTIONS}
                        value={checked}
                        onChange={(v) => setChecked(v as string[])}
                    />
                    <div>
                        <Button
                            type='primary'
                            icon={<UsbOutlined />}
                            loading={loading}
                            disabled={!checked.length}
                            onClick={handleConnect}
                        >
                            Подключить Trezor
                        </Button>
                    </div>
                </div>
            )}

            <Alert
                className='mt-4'
                type='info'
                showIcon
                icon={<SafetyOutlined />}
                message='Нужен браузер на базе Chromium (Chrome/Edge) с поддержкой WebUSB. При первом подключении подтвердите экспорт на экране устройства.'
            />
        </Card>
    );
};
export default TrezorConnectCard;
