'use client';
import React, { useMemo } from 'react';
import { Skeleton } from 'antd';
import { useShareCandles } from '@/hooks/useShareDetail';
import { getYearAgo } from '@/utils/dateUtils';
import { formatMoney } from '@/utils/formatCurrency';
import style from './style.module.scss';

interface PriceRangeProps {
    ticker: string;
    price: number | null;
    currency: string;
}

/** 52-недельный диапазон цены с маркером текущего значения. */
const PriceRange: React.FC<PriceRangeProps> = ({ ticker, price, currency }) => {
    const { data: candles = [], isLoading } = useShareCandles(ticker, getYearAgo());

    const range = useMemo(() => {
        if (!candles.length) return null;
        const highs = candles.map((c) => c.high).filter((v) => v > 0);
        const lows = candles.map((c) => c.low).filter((v) => v > 0);
        if (!highs.length || !lows.length) return null;
        return { high: Math.max(...highs), low: Math.min(...lows) };
    }, [candles]);

    if (isLoading) {
        return <Skeleton.Button active block style={{ height: 92, marginTop: 20 }} />;
    }
    if (!range || price === null) return null;

    const span = range.high - range.low;
    const position = span > 0 ? ((price - range.low) / span) * 100 : 50;
    const clamped = Math.min(100, Math.max(0, position));
    const fromHigh = range.high > 0 ? ((price - range.high) / range.high) * 100 : 0;
    const fromLow = range.low > 0 ? ((price - range.low) / range.low) * 100 : 0;

    return (
        <section className={style.wrapper}>
            <div className={style.head}>
                <h2 className={style.title}>52-недельный диапазон</h2>
                <span className={style.sub}>
                    {fromHigh < 0 ? `${fromHigh.toFixed(1)}% от максимума` : 'у максимума'} ·{' '}
                    +{fromLow.toFixed(1)}% от минимума
                </span>
            </div>

            <div className={style.track}>
                <div className={style.fill} style={{ width: `${clamped}%` }} />
                <div className={style.marker} style={{ left: `${clamped}%` }}>
                    <span className={style.markerDot} />
                    <span className={style.markerLabel}>{formatMoney(price, currency)}</span>
                </div>
            </div>

            <div className={style.bounds}>
                <div className={style.bound}>
                    <span className={style.boundLabel}>Минимум</span>
                    <span className={style.boundValue}>{formatMoney(range.low, currency)}</span>
                </div>
                <div className={`${style.bound} ${style.boundRight}`}>
                    <span className={style.boundLabel}>Максимум</span>
                    <span className={style.boundValue}>{formatMoney(range.high, currency)}</span>
                </div>
            </div>
        </section>
    );
};
export default PriceRange;
