'use client';
import React from 'react';
import { Skeleton } from 'antd';
import {
    BankOutlined,
    LineChartOutlined,
    DollarOutlined,
    MoneyCollectOutlined,
    FireOutlined
} from '@ant-design/icons';
import { formatMoney, formatPercent } from '@/utils/formatCurrency';
import { useCbrRates, useImoex, useKeyRate, useMarketFutures } from '@/hooks/useMarketOverview';
import style from './style.module.scss';

export interface IndicatorTileProps {
    label: string;
    icon: React.ReactNode;
    value?: string;
    /** Дневное изменение в % — рисуется цветной дельтой (зелёный/красный). */
    change?: number;
    /** Дополнительная приглушённая подпись (дата, тикер контракта). */
    sub?: React.ReactNode;
    loading?: boolean;
}

/** Цвет по знаку изменения: рост — зелёный, падение — красный, ноль — нейтральный. */
const deltaClass = (change?: number): string | undefined => {
    if (change === undefined || change === 0) return undefined;
    return change > 0 ? style.up : style.down;
};

/** Плитка ключевого индикатора рынка. */
export const IndicatorTile: React.FC<IndicatorTileProps> = ({
    label,
    icon,
    value,
    change,
    sub,
    loading
}) => {
    const delta = deltaClass(change);
    return (
        <div className={style.tile}>
            <span className={style.tileLabel}>
                {icon}
                {label}
            </span>
            {loading ? (
                <>
                    <Skeleton.Button active size='small' style={{ width: 100, height: 26 }} />
                    <Skeleton.Button active size='small' style={{ width: 64, height: 14 }} />
                </>
            ) : (
                <>
                    <span className={`${style.tileValue} ${delta ?? ''}`}>{value ?? '—'}</span>
                    {(change !== undefined || sub) && (
                        <span className={style.tileSub}>
                            {change !== undefined && (
                                <span className={delta}>{formatPercent(change)}</span>
                            )}
                            {sub && <span className={style.tileMuted}>{sub}</span>}
                        </span>
                    )}
                </>
            )}
        </div>
    );
};

const NUMBER_2 = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const IndicatorRibbon: React.FC = () => {
    const keyRate = useKeyRate();
    const imoex = useImoex();
    const futures = useMarketFutures();
    const cbr = useCbrRates();

    const usd = futures.data?.usd;
    const cny = futures.data?.cny;
    const brent = futures.data?.brent;

    const cbrSub = (rate?: number | null) =>
        rate ? `ЦБ ${formatMoney(rate, 'RUB')}` : undefined;

    return (
        <div className={style.ribbon}>
            <IndicatorTile
                label='Ставка ЦБ'
                icon={<BankOutlined />}
                loading={keyRate.isLoading}
                value={keyRate.data ? `${NUMBER_2.format(keyRate.data.rate)}%` : undefined}
                sub='ключевая ставка'
            />
            <IndicatorTile
                label='Индекс Мосбиржи'
                icon={<LineChartOutlined />}
                loading={imoex.isLoading}
                value={imoex.data ? NUMBER_2.format(imoex.data.value) : undefined}
                change={imoex.data?.changePct}
            />
            <IndicatorTile
                label='Доллар'
                icon={<DollarOutlined />}
                loading={futures.isLoading}
                value={usd ? formatMoney(usd.price, 'RUB') : undefined}
                change={usd?.changePct}
                sub={cbrSub(cbr.data?.usd)}
            />
            <IndicatorTile
                label='Юань'
                icon={<MoneyCollectOutlined />}
                loading={futures.isLoading}
                value={cny ? formatMoney(cny.price, 'RUB') : undefined}
                change={cny?.changePct}
                sub={cbrSub(cbr.data?.cny)}
            />
            <IndicatorTile
                label='Нефть Brent'
                icon={<FireOutlined />}
                loading={futures.isLoading}
                value={brent ? `$${brent.price.toFixed(1)}` : undefined}
                change={brent?.changePct}
                sub={brent?.name}
            />
        </div>
    );
};

export default IndicatorRibbon;
