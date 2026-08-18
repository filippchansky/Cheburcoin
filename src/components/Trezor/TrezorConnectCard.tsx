'use client';
import React from 'react';
import { Alert, Button, Card, Input, Popconfirm, Space, Tag, Typography, notification } from 'antd';
import { DisconnectOutlined, SafetyOutlined, WalletOutlined } from '@ant-design/icons';
import { ITrezorAccount } from '@models/trezor';
import { TREZOR_COINS } from '@/lib/trezor/coins';
import { validateDescriptor } from '@/lib/trezor/validate';
import { useTrezor, useSetTrezorAccounts, useDisconnectTrezor } from '@/hooks/useTrezor';

const { Text, Link } = Typography;

// Стабильная ссылка на пустой список — чтобы эффект синхронизации не зацикливался
// на новом [] при каждом рендере (react-query отдаёт undefined до загрузки).
const EMPTY: ITrezorAccount[] = [];

/** Подсказка: что вставлять и где взять, по каждой монете. */
const HINTS: Record<string, { placeholder: string; where: string }> = {
    BTC: {
        placeholder: 'xpub… / zpub…',
        where: 'Trezor Suite → аккаунт Bitcoin → «Детали аккаунта» → «Показать публичный ключ»'
    },
    ETH: {
        placeholder: '0x…',
        where: 'Trezor Suite → аккаунт Ethereum → адрес получения (0x…)'
    },
    SOL: {
        placeholder: 'base58-адрес',
        where: 'Trezor Suite → аккаунт Solana → адрес получения'
    }
};

/** Сокращает дескриптор для показа: xpub6C…dyUhrx. */
const shortDescriptor = (d: string) => (d.length > 16 ? `${d.slice(0, 8)}…${d.slice(-6)}` : d);

const TrezorConnectCard: React.FC = () => {
    const { data } = useTrezor();
    const accounts = data ?? EMPTY;
    const setTrezor = useSetTrezorAccounts();
    const disconnect = useDisconnectTrezor();
    const [api, contextHolder] = notification.useNotification();

    const [descriptors, setDescriptors] = React.useState<Record<string, string>>({});
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    // Подтягиваем сохранённые дескрипторы в поля при загрузке/смене аккаунтов.
    React.useEffect(() => {
        const next: Record<string, string> = {};
        accounts.forEach((a) => {
            next[a.coin] = a.descriptor;
        });
        setDescriptors(next);
    }, [accounts]);

    const isConnected = accounts.length > 0;

    const handleSave = async () => {
        const next: ITrezorAccount[] = [];
        const nextErrors: Record<string, string> = {};

        for (const coin of TREZOR_COINS) {
            const raw = (descriptors[coin.key] ?? '').trim();
            if (!raw) continue; // пустое поле = монета не подключена
            const err = validateDescriptor(coin.adapter, raw);
            if (err) {
                nextErrors[coin.key] = err;
                continue;
            }
            next.push({ coin: coin.key, descriptor: raw, label: coin.name });
        }

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;

        if (!next.length) {
            api.info({ placement: 'top', message: 'Вставьте хотя бы один дескриптор' });
            return;
        }

        await setTrezor.mutateAsync(next);
        api.success({ placement: 'top', message: 'Сохранено' });
    };

    return (
        <Card
            title={
                <Space>
                    <WalletOutlined />
                    Криптокошелёк (Trezor)
                </Space>
            }
        >
            {contextHolder}

            <div className='flex flex-col gap-4'>
                {isConnected && (
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
                )}

                <Text type='secondary'>
                    Вставьте публичный дескриптор — <b>xpub для BTC</b> или адрес получения для
                    ETH/SOL. Это read-only: показывает баланс, но не позволяет тратить. Приватные
                    ключи остаются на устройстве, само устройство подключать не нужно.
                </Text>

                {TREZOR_COINS.map((coin) => {
                    const hint = HINTS[coin.key];
                    return (
                        <div key={coin.key} className='flex flex-col gap-1'>
                            <Text strong>
                                {coin.name} ({coin.key})
                            </Text>
                            <Input
                                allowClear
                                value={descriptors[coin.key] ?? ''}
                                placeholder={hint?.placeholder}
                                status={errors[coin.key] ? 'error' : undefined}
                                onChange={(e) =>
                                    setDescriptors((prev) => ({
                                        ...prev,
                                        [coin.key]: e.target.value
                                    }))
                                }
                            />
                            {errors[coin.key] ? (
                                <Text type='danger' className='text-xs'>
                                    {errors[coin.key]}
                                </Text>
                            ) : (
                                <Text type='secondary' className='text-xs'>
                                    {hint?.where}
                                </Text>
                            )}
                        </div>
                    );
                })}

                <Space>
                    <Button
                        type='primary'
                        icon={<WalletOutlined />}
                        loading={setTrezor.isPending}
                        onClick={handleSave}
                    >
                        Сохранить
                    </Button>
                    {isConnected && (
                        <Popconfirm
                            title='Отключить Trezor?'
                            description='Сохранённые дескрипторы будут удалены.'
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
                    type='info'
                    showIcon
                    icon={<SafetyOutlined />}
                    message={
                        <span>
                            Дескриптор виден в Trezor Suite. Для BTC берите именно расширенный ключ
                            (xpub/zpub) — по одному адресу баланс будет неполным.{' '}
                            <Link href='https://suite.trezor.io' target='_blank' rel='noreferrer'>
                                Открыть Trezor Suite
                            </Link>
                        </span>
                    }
                />
            </div>
        </Card>
    );
};
export default TrezorConnectCard;
