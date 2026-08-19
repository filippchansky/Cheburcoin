import React from 'react';
import { formatAmount, intToCompact } from '@/utils/formatCurrency';
import type { ICoinDetail, VsCurrency } from '@models/crypto';
import style from './style.module.scss';

const vsCode = (vs: VsCurrency) => (vs === 'usd' ? 'USD' : 'RUB');

const fmtDate = (iso: string | null): string | undefined =>
    iso
        ? new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })
        : undefined;

interface StatProps {
    label: string;
    value: string;
    sub?: string;
}

const Stat: React.FC<StatProps> = ({ label, value, sub }) => (
    <div className={style.stat}>
        <span className={style.statLabel}>{label}</span>
        <span className={style.statValue}>{value}</span>
        {sub && <span className={style.statSub}>{sub}</span>}
    </div>
);

interface CoinStatsProps {
    coin: ICoinDetail;
    vs: VsCurrency;
}

/** Сетка ключевых показателей монеты: капа, объём, диапазоны, предложение, ATH/ATL. */
const CoinStats: React.FC<CoinStatsProps> = ({ coin, vs }) => {
    const code = vsCode(vs);
    const sym = coin.symbol;
    const money = (v: number | null, compact = false) =>
        v === null ? '—' : formatAmount(v, code, { compact });
    const supply = (v: number | null) => (v === null ? '—' : `${intToCompact(v)} ${sym}`);

    return (
        <div className={style.statsGrid}>
            <Stat label='Капитализация' value={money(coin.marketCap, true)} />
            <Stat label='Объём 24ч' value={money(coin.volume, true)} />
            <Stat label='Максимум 24ч' value={money(coin.high24h)} />
            <Stat label='Минимум 24ч' value={money(coin.low24h)} />
            <Stat label='В обращении' value={supply(coin.circulatingSupply)} />
            <Stat
                label='Макс. предложение'
                value={coin.maxSupply === null ? '∞' : supply(coin.maxSupply)}
            />
            <Stat label='Исторический максимум' value={money(coin.ath)} sub={fmtDate(coin.athDate)} />
            <Stat label='Исторический минимум' value={money(coin.atl)} sub={fmtDate(coin.atlDate)} />
        </div>
    );
};
export default CoinStats;
