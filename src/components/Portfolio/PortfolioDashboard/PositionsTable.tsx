'use client';
import React from 'react';
import { Button, Empty, Grid, Spin, Table, TableProps, Tag } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { IPosition } from '@models/tinkoffData';
import TableName from '@/components/TableName/TableName';
import ShareLogo from '@/components/ShareLogo/ShareLogo';
import CryptoLotsDrawer from '@/components/Portfolio/CryptoLotsDrawer';
import { formatAmount, formatPercent } from '@/utils/formatCurrency';
import { currencySymbol } from '@/utils/currencyRegistry';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import {
    INSTRUMENT_TYPE_COLOR,
    instrumentTypeLabel,
    PORTFOLIO_INSTRUMENT_TYPES
} from '@/utils/instrumentType';
import { positionHref } from '@/utils/positionHref';
import style from './style.module.scss';

interface PositionsTableProps {
    positions: IPosition[];
    total: number;
    loading?: boolean;
    /** instrumentUid → (реализованный + начисления нетто), ₽. Для полной «Прибыли». */
    profitExtraByUid?: Map<string, number>;
}

/**
 * Сумма без принудительных копеек + символ валюты позиции: 38520/rub → «38 520 ₽»,
 * 161.78/usd → «161,78 $». currency=null (рублёвая/старый бек) → рубль.
 */
const compactAmount = (v: number, currency: string | null) =>
    `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(v)} ${currencySymbol(currency)}`;

/** То же со знаком: «+2 266,44 ₽», «−7 599,5 $». */
const signedCompactAmount = (v: number, currency: string | null) =>
    `${v > 0 ? '+' : v < 0 ? '−' : ''}${compactAmount(Math.abs(v), currency)}`;

/** Кол-во монет с точностью до 4 знаков: 1.2345 SOL. */
const formatCoins = (v: number) =>
    new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 4 }).format(v);

/** Доллары: без копеек от $100, с копейками для мелких сумм. */
const formatUsd = (v: number) => formatAmount(v, 'USD', { digits: Math.abs(v) >= 100 ? 0 : 2 });

const PositionsTable: React.FC<PositionsTableProps> = ({
    positions,
    total,
    loading,
    profitExtraByUid
}) => {
    const router = useRouter();
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const screens = Grid.useBreakpoint();
    const isMobile = screens.md === false;
    // Открытый Drawer ввода покупок крипты (тикер монеты или null).
    const [lotsCoin, setLotsCoin] = React.useState<string | null>(null);

    // По крипте (Trezor/Bybit) себестоимость вводится вручную — показываем кнопку.
    const isCrypto = (p: IPosition) => p.instrumentType === 'crypto';

    // Полная прибыль = курсовая (FIFO) + реализованный P/L проданных лотов +
    // начисления нетто (с учётом связки обычка↔префы). Совпадает с «Прибыль» на
    // странице бумаги. Пока история выплат/продаж грузится — extra=0 (курсовая).
    const totalProfit = (position: IPosition) =>
        (position.expectedYieldFifo ?? 0) + (profitExtraByUid?.get(position.instrumentUid) ?? 0);
    // Процент — от вложенного (средняя × кол-во), чтобы согласовался с рублём.
    const totalProfitPercent = (position: IPosition) => {
        const invested = (position.averagePositionPrice ?? 0) * (position.quantity ?? 0);
        return invested > 0 ? (totalProfit(position) / invested) * 100 : 0;
    };

    const columns: TableProps<IPosition>['columns'] = [
        {
            title: 'Наименование',
            dataIndex: 'name',
            key: 'name',
            render: (_, { ticker, name, isin, stakedQuantity, logoUrl }) => (
                <div className='flex flex-col gap-1'>
                    <TableName
                        icon={isin ?? ''}
                        ticker={ticker ?? ''}
                        title={name ?? ''}
                        logoSrc={logoUrl}
                    />
                    {stakedQuantity ? (
                        <Tag color='gold' style={{ width: 'fit-content' }}>
                            🔒 В стейкинге: {formatCoins(stakedQuantity)} {ticker}
                        </Tag>
                    ) : null}
                </div>
            )
        },
        {
            title: 'В портфеле',
            key: 'value',
            align: 'right',
            render: (_, { priceInPorfolio, currency, usd }) =>
                usd ? (
                    <div className='flex flex-col'>
                        <span>{formatUsd(usd.value)}</span>
                        <span className={style.sub} style={{ color: palette.textMuted }}>
                            {formatAmount(priceInPorfolio, 'RUB')}
                        </span>
                    </div>
                ) : (
                    formatAmount(priceInPorfolio, currency)
                )
        },
        {
            title: 'Цена',
            key: 'price',
            align: 'right',
            render: (_, { averagePositionPrice, currentPrice, currency, usd }) =>
                usd ? (
                    <div className='flex flex-col'>
                        <span>{formatUsd(usd.price)}</span>
                        <span className={style.sub} style={{ color: palette.textMuted }}>
                            {formatAmount(currentPrice, 'RUB')}
                        </span>
                    </div>
                ) : (
                    <div className='flex flex-col'>
                        <span>{formatAmount(currentPrice, currency)}</span>
                        <span className={style.sub} style={{ color: palette.textMuted }}>
                            {formatAmount(averagePositionPrice, currency)}
                        </span>
                    </div>
                )
        },
        {
            title: 'Прибыль',
            key: 'pl',
            align: 'right',
            render: (_, record) => {
                const hasCost = (record.averagePositionPrice ?? 0) > 0;
                // Крипта без введённых покупок — вместо прочерка кнопка «добавить».
                if (isCrypto(record) && !hasCost) {
                    return (
                        <Button
                            size='small'
                            type='link'
                            icon={<PlusOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                setLotsCoin(record.ticker ?? null);
                            }}
                        >
                            покупки
                        </Button>
                    );
                }
                const value = totalProfit(record);
                const positive = value >= 0;
                const cls = positive ? style.gain : style.loss;
                return (
                    <div className='flex items-center justify-end gap-1'>
                        <div className='flex flex-col'>
                            <span className={cls}>
                                {formatAmount(value, record.currency, { signed: true })}
                            </span>
                            <span className={[cls, style.sub].join(' ')}>
                                {formatPercent(totalProfitPercent(record))}
                            </span>
                        </div>
                        {isCrypto(record) && (
                            <Button
                                size='small'
                                type='text'
                                icon={<EditOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLotsCoin(record.ticker ?? null);
                                }}
                            />
                        )}
                    </div>
                );
            },
            sorter: (a, b) => totalProfit(a) - totalProfit(b)
        },
        {
            title: 'За день',
            key: 'daily',
            align: 'right',
            render: (_, { dailyYield, currency }) => {
                const positive = (dailyYield ?? 0) >= 0;
                return (
                    <span className={positive ? style.gain : style.loss}>
                        {formatAmount(dailyYield ?? 0, currency, { signed: true })}
                    </span>
                );
            },
            sorter: (a, b) => (a.dailyYield ?? 0) - (b.dailyYield ?? 0)
        },
        {
            title: 'Кол-во',
            key: 'quantity',
            align: 'right',
            // Крипта — дробное кол-во монет (до 4 знаков); бумаги — целые лоты.
            render: (_, { quantity, instrumentType }) =>
                instrumentType === 'crypto' ? formatCoins(quantity) : quantity
        },
        {
            title: 'Вес',
            key: 'weight',
            align: 'right',
            render: (_, { priceInPorfolio }) => {
                const weight = total > 0 ? (priceInPorfolio / total) * 100 : 0;
                return (
                    <div className={style.weightCell}>
                        <span>{weight.toFixed(1)}%</span>
                        <div className={style.weightBar} style={{ background: palette.border }}>
                            <div
                                className={style.weightBarFill}
                                style={{
                                    width: `${Math.min(weight, 100)}%`,
                                    background: palette.primary
                                }}
                            />
                        </div>
                    </div>
                );
            },
            sorter: (a, b) => a.priceInPorfolio - b.priceInPorfolio,
            defaultSortOrder: 'descend'
        },
        {
            title: 'Тип',
            key: 'instrumentType',
            render: (_, { instrumentType }) => (
                <Tag color={INSTRUMENT_TYPE_COLOR[instrumentType]}>
                    {instrumentTypeLabel(instrumentType)}
                </Tag>
            ),
            filters: PORTFOLIO_INSTRUMENT_TYPES.map((type) => ({
                text: instrumentTypeLabel(type),
                value: type
            })),
            onFilter: (value, record) => record.instrumentType === value
        }
    ];

    if (!positions.length) {
        return loading ? (
            <div className='text-center py-6'>
                <Spin />
            </div>
        ) : (
            <Empty description='Нет позиций' />
        );
    }

    if (isMobile) {
        // По убыванию стоимости в портфеле — как defaultSortOrder таблицы на десктопе.
        const sorted = [...positions].sort((a, b) => b.priceInPorfolio - a.priceInPorfolio);
        const shown = sorted;
        return (
            <div className={style.posList} style={{ ['--rowBorder' as string]: palette.border }}>
                {shown.map((position) => {
                    const href = positionHref(position);
                    const profit = totalProfit(position);
                    const plCls = profit >= 0 ? style.gain : style.loss;
                    return (
                        <div
                            key={position.positionUid}
                            className={`${style.posRow} ${href ? style.posRowClickable : ''}`}
                            onClick={() => href && router.push(href)}
                        >
                            <ShareLogo
                                icon={position.isin ?? ''}
                                ticker={position.ticker ?? ''}
                                size={40}
                                src={position.logoUrl}
                            />
                            <div className={style.posMain}>
                                <span className={style.posName}>
                                    {position.name ?? position.ticker ?? '—'}
                                </span>
                                <span className={`${style.posSub} ${style.posSubMuted}`}>
                                    {position.usd
                                        ? `${formatCoins(position.quantity)} ${position.ticker}`
                                        : `${position.quantity} шт`}{' '}
                                    ·{' '}
                                    {position.usd
                                        ? formatUsd(position.usd.price)
                                        : compactAmount(position.currentPrice, position.currency)}
                                </span>
                                {position.stakedQuantity ? (
                                    <span className={`${style.posSub} ${style.posSubMuted}`}>
                                        🔒 в стейкинге: {formatCoins(position.stakedQuantity)}{' '}
                                        {position.ticker}
                                    </span>
                                ) : null}
                            </div>
                            <div className={style.posRight}>
                                <span className={style.posValue}>
                                    {position.usd
                                        ? formatUsd(position.usd.value)
                                        : compactAmount(
                                              position.priceInPorfolio,
                                              position.currency
                                          )}
                                </span>
                                {(() => {
                                    const hasCost = (position.averagePositionPrice ?? 0) > 0;
                                    const cryptoRow = position.instrumentType === 'crypto';
                                    // Крипта: тап по строке прибыли открывает ввод покупок.
                                    const openLots = (e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        setLotsCoin(position.ticker ?? null);
                                    };
                                    if (cryptoRow && !hasCost) {
                                        return (
                                            <span
                                                className={`${style.posSub}`}
                                                style={{ color: palette.primary }}
                                                onClick={openLots}
                                            >
                                                + покупки
                                            </span>
                                        );
                                    }
                                    return (
                                        <span
                                            className={`${style.posSub} ${plCls}`}
                                            onClick={cryptoRow ? openLots : undefined}
                                        >
                                            {signedCompactAmount(profit, position.currency)} ·{' '}
                                            {Math.abs(totalProfitPercent(position)).toFixed(2)}%
                                            {cryptoRow ? ' ✎' : ''}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                    );
                })}
                <CryptoLotsDrawer
                    coin={lotsCoin}
                    open={!!lotsCoin}
                    onClose={() => setLotsCoin(null)}
                />
            </div>
        );
    }

    return (
        <>
            <Table<IPosition>
                loading={loading}
                columns={columns}
                dataSource={positions}
                rowKey='positionUid'
                scroll={{ x: 'max-content' }}
                pagination={false}
                rowClassName={(record) => (positionHref(record) ? style.clickableRow : '')}
                onRow={(record) => ({
                    onClick: () => {
                        const href = positionHref(record);
                        if (href) router.push(href);
                    }
                })}
            />
            <CryptoLotsDrawer
                coin={lotsCoin}
                open={!!lotsCoin}
                onClose={() => setLotsCoin(null)}
            />
        </>
    );
};
export default PositionsTable;
