'use client';
import React from 'react';
import { Button, Drawer, InputNumber, Space, Typography, notification } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { CryptoLot, lotsToAvgPrices } from '@/lib/portfolio/cryptoLots';
import { useCryptoLots, useSetCryptoLots } from '@/hooks/useCryptoLots';
import { useCryptoPositions } from '@/hooks/useCryptoPositions';
import { useBybitPositions } from '@/hooks/useBybitPositions';

const { Text } = Typography;

interface CryptoLotsDrawerProps {
    /** Тикер монеты (BTC/ETH/SOL/…). null = закрыто. */
    coin: string | null;
    open: boolean;
    onClose: () => void;
}

/** Черновая строка ввода (строки, чтобы поля можно было чистить). */
interface DraftRow {
    qty: string;
    price: string;
}

const EPS = 1e-8;

const toDraft = (lots: CryptoLot[]): DraftRow[] =>
    lots.length
        ? lots.map((l) => ({ qty: String(l.qty), price: String(l.price) }))
        : [{ qty: '', price: '' }];

/**
 * Ввод покупок монеты (единых по монете: Trezor + Bybit). Холдинг и текущую цену
 * берём из ОБОИХ источников — лоты представляют всю крипту этого тикера, поэтому
 * лимит по балансу = суммарный холдинг, а не отдельного счёта.
 */
const CryptoLotsDrawer: React.FC<CryptoLotsDrawerProps> = ({ coin, open, onClose }) => {
    const { data: allLots } = useCryptoLots();
    const setLots = useSetCryptoLots();
    const { positions: trezorPos } = useCryptoPositions();
    const { positions: bybitPos } = useBybitPositions();
    const [api, contextHolder] = notification.useNotification();

    const [rows, setRows] = React.useState<DraftRow[]>([{ qty: '', price: '' }]);

    // Подтягиваем сохранённые покупки монеты при открытии/смене монеты.
    React.useEffect(() => {
        if (!coin) return;
        setRows(toDraft(allLots?.[coin] ?? []));
    }, [coin, allLots]);

    // Суммарный холдинг и текущая цена ($) по монете из обоих источников.
    const coinPositions = [...trezorPos, ...bybitPos].filter((p) => p.ticker === coin);
    const holdingQty = coinPositions.reduce((s, p) => s + (p.quantity ?? 0), 0);
    const currentPriceUsd = coinPositions.find((p) => p.usd?.price)?.usd?.price;
    const capped = coin != null && holdingQty > 0;

    // Средневзвешенная и превью прибыли по валидным строкам.
    const validLots: CryptoLot[] = rows
        .map((r) => ({ qty: Number(r.qty), price: Number(r.price) }))
        .filter((l) => l.qty > 0 && l.price > 0);
    const avgUsd = coin ? lotsToAvgPrices({ [coin]: validLots })[coin] ?? 0 : 0;
    const totalQty = validLots.reduce((s, l) => s + l.qty, 0);
    const profitUsd =
        avgUsd && currentPriceUsd != null ? (currentPriceUsd - avgUsd) * holdingQty : 0;

    // Ограничение по балансу: суммарно нельзя ввести больше монет, чем есть сейчас.
    const enteredQty = rows.reduce((s, r) => s + Math.max(0, Number(r.qty) || 0), 0);
    const remaining = capped ? holdingQty - enteredQty : Infinity;
    // Максимум для строки = холдинг − сумма ОСТАЛЬНЫХ строк.
    const maxForRow = (i: number): number | undefined => {
        if (!capped) return undefined;
        const others = enteredQty - Math.max(0, Number(rows[i].qty) || 0);
        return Math.max(0, holdingQty - others);
    };

    const updateRow = (i: number, patch: Partial<DraftRow>) =>
        setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

    const addRow = () => setRows((prev) => [...prev, { qty: '', price: '' }]);
    const removeRow = (i: number) =>
        setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

    const handleSave = async () => {
        if (!coin) return;
        if (capped && enteredQty > holdingQty + EPS) {
            api.error({
                placement: 'top',
                message: 'Больше, чем на балансе',
                description: `Всего ${holdingQty} ${coin}. Уберите лишние монеты.`
            });
            return;
        }
        // Пишем всю карту лотов: текущую монету заменяем, остальные не трогаем.
        // Пустой список валидных строк = удаляем монету (прибыль → прочерк).
        const next = { ...(allLots ?? {}) };
        if (validLots.length) next[coin] = validLots;
        else delete next[coin];

        await setLots.mutateAsync(next);
        api.success({ placement: 'top', message: 'Покупки сохранены' });
        onClose();
    };

    return (
        <Drawer
            title={coin ? `Покупки — ${coin}` : 'Покупки'}
            open={open}
            onClose={onClose}
            width={420}
            destroyOnClose
        >
            {contextHolder}
            <div className='flex flex-col gap-4'>
                <Text type='secondary'>
                    Себестоимость крипты нигде не хранится — введите свои покупки (сколько монет и по
                    какой цене в $). Из них считается средневзвешенная цена и прибыль. Покупки едины
                    для монеты и на кошельке (Trezor), и на бирже (Bybit).
                </Text>

                {capped && (
                    <Text type={remaining < -EPS ? 'danger' : 'secondary'} className='text-xs'>
                        Всего на балансе: {holdingQty} {coin}. Осталось распределить:{' '}
                        {Math.max(0, Number(remaining.toFixed(8)))} {coin}
                    </Text>
                )}

                <div className='flex flex-col gap-2'>
                    <div className='flex gap-2 px-1'>
                        <Text type='secondary' className='text-xs' style={{ flex: 1 }}>
                            Кол-во монет
                        </Text>
                        <Text type='secondary' className='text-xs' style={{ flex: 1 }}>
                            Цена покупки, $
                        </Text>
                        <span style={{ width: 32 }} />
                    </div>

                    {rows.map((row, i) => (
                        <div key={i} className='flex gap-2 items-center'>
                            <InputNumber<number>
                                style={{ flex: 1 }}
                                min={0}
                                max={maxForRow(i)}
                                stringMode
                                placeholder='0.0'
                                value={row.qty ? Number(row.qty) : undefined}
                                onChange={(v) => updateRow(i, { qty: v == null ? '' : String(v) })}
                            />
                            <InputNumber<number>
                                style={{ flex: 1 }}
                                min={0}
                                stringMode
                                prefix='$'
                                placeholder='0.00'
                                value={row.price ? Number(row.price) : undefined}
                                onChange={(v) => updateRow(i, { price: v == null ? '' : String(v) })}
                            />
                            <Button
                                type='text'
                                icon={<DeleteOutlined />}
                                onClick={() => removeRow(i)}
                                disabled={rows.length === 1}
                            />
                        </div>
                    ))}

                    <Button
                        type='dashed'
                        icon={<PlusOutlined />}
                        onClick={addRow}
                        block
                        disabled={capped && remaining <= EPS}
                    >
                        Добавить покупку
                    </Button>
                </div>

                {avgUsd > 0 && (
                    <div
                        className='flex flex-col gap-1 rounded-md p-3'
                        style={{ background: 'rgba(127,127,127,0.08)' }}
                    >
                        <div className='flex justify-between'>
                            <Text type='secondary'>Средняя цена</Text>
                            <Text strong>${avgUsd.toFixed(2)}</Text>
                        </div>
                        <div className='flex justify-between'>
                            <Text type='secondary'>Введено покупок</Text>
                            <Text>{totalQty}</Text>
                        </div>
                        {currentPriceUsd != null && (
                            <div className='flex justify-between'>
                                <Text type='secondary'>Прибыль (на {holdingQty} монет)</Text>
                                <Text style={{ color: profitUsd >= 0 ? '#3f9d58' : '#d4380d' }}>
                                    {profitUsd >= 0 ? '+' : '−'}${Math.abs(profitUsd).toFixed(2)}
                                </Text>
                            </div>
                        )}
                    </div>
                )}

                <Space>
                    <Button type='primary' loading={setLots.isPending} onClick={handleSave}>
                        Сохранить
                    </Button>
                    <Button onClick={onClose}>Отмена</Button>
                </Space>
            </div>
        </Drawer>
    );
};
export default CryptoLotsDrawer;
