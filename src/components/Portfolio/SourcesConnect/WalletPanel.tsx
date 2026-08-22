'use client';
import React from 'react';
import {
    Button,
    Input,
    Popconfirm,
    Popover,
    Segmented,
    Space,
    Tag,
    Typography,
    notification
} from 'antd';
import { DisconnectOutlined, QuestionCircleOutlined, WalletOutlined } from '@ant-design/icons';
import { ITrezorAccount } from '@models/trezor';
import { TREZOR_COINS } from '@/lib/trezor/coins';
import { WALLET_OPTIONS, walletByKey } from '@/lib/trezor/wallets';
import { validateDescriptor } from '@/lib/trezor/validate';
import { useTrezor, useSetTrezorAccounts, useDisconnectTrezor } from '@/hooks/useTrezor';

const { Text, Link } = Typography;

// Стабильная ссылка на пустой список — чтобы эффект синхронизации не зацикливался.
const EMPTY: ITrezorAccount[] = [];

/** Плейсхолдер поля ввода по ключу монеты. */
const PLACEHOLDER: Record<string, string> = {
    BTC: 'xpub… / zpub…',
    ETH: '0x…',
    SOL: 'base58-адрес'
};

/** Общая подсказка, если выбранный кошелёк эту монету не хранит. */
const FALLBACK_HINT: Record<string, string> = {
    utxo: 'В выбранном кошельке этой монеты нет. Нужен расширенный ключ (xpub/zpub) — его дают аппаратные кошельки (Trezor, Ledger).',
    evm: 'В выбранном кошельке этой монеты нет. Вставьте адрес получения 0x… из любого EVM-кошелька.',
    solana: 'В выбранном кошельке этой монеты нет. Вставьте адрес получения из любого Solana-кошелька.'
};

/** Сокращает дескриптор для показа: xpub6C…dyUhrx. */
const shortDescriptor = (d: string) => (d.length > 16 ? `${d.slice(0, 8)}…${d.slice(-6)}` : d);

/**
 * Тело источника «Криптокошелёк» для аккордеона. Кошелёк-агностично: механика
 * одна (вставить публичный дескриптор), переключатель сверху лишь подменяет
 * инструкцию «где взять». Заголовок и контейнер даёт строка аккордеона.
 */
const WalletPanel: React.FC = () => {
    const { data } = useTrezor();
    const accounts = data ?? EMPTY;
    const setTrezor = useSetTrezorAccounts();
    const disconnect = useDisconnectTrezor();
    const [api, contextHolder] = notification.useNotification();

    const [wallet, setWallet] = React.useState<string>(WALLET_OPTIONS[0].key);
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
    const selectedWallet = walletByKey(wallet);

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
        <div className='flex flex-col gap-4'>
            {contextHolder}

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
                Вставьте публичный ключ (xpub) или адрес получения — это read-only: показывает
                баланс, но тратить нельзя. Работает с любым кошельком, приватные ключи остаются у
                вас.
            </Text>

            <div>
                <Text type='secondary' className='text-xs'>
                    Инструкция для кошелька:
                </Text>
                <div className='mt-1'>
                    <Segmented
                        size='small'
                        value={wallet}
                        onChange={(val) => setWallet(val as string)}
                        options={WALLET_OPTIONS.map((w) => ({ label: w.name, value: w.key }))}
                    />
                </div>
            </div>

            {TREZOR_COINS.map((coin) => {
                const walletHint = selectedWallet?.hints[coin.key];
                const hintText = walletHint ?? FALLBACK_HINT[coin.adapter];
                const showLink = Boolean(walletHint && selectedWallet?.link);
                return (
                    <div key={coin.key} className='flex flex-col gap-1'>
                        <div className='flex items-center gap-1'>
                            <Text strong>
                                {coin.name} ({coin.key})
                            </Text>
                            <Popover
                                trigger={['hover', 'click']}
                                content={
                                    <div style={{ maxWidth: 260 }}>
                                        <div>{hintText}</div>
                                        {showLink && (
                                            <div className='mt-1'>
                                                <Link
                                                    href={selectedWallet!.link}
                                                    target='_blank'
                                                    rel='noreferrer'
                                                >
                                                    {selectedWallet!.linkLabel}
                                                </Link>
                                            </div>
                                        )}
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
                            value={descriptors[coin.key] ?? ''}
                            placeholder={PLACEHOLDER[coin.key]}
                            status={errors[coin.key] ? 'error' : undefined}
                            onChange={(e) =>
                                setDescriptors((prev) => ({
                                    ...prev,
                                    [coin.key]: e.target.value
                                }))
                            }
                        />
                        {errors[coin.key] && (
                            <Text type='danger' className='text-xs'>
                                {errors[coin.key]}
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
                        title='Отключить криптокошелёк?'
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
                )}
            </Space>
        </div>
    );
};

export default WalletPanel;
