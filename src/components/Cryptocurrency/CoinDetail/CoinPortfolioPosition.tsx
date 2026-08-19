'use client';
import React from 'react';
import { Skeleton, Tag, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useCryptoPositions } from '@/hooks/useCryptoPositions';
import { trezorCoinByCoingeckoId } from '@/lib/trezor/coins';
import { formatAmount } from '@/utils/formatCurrency';
import type { VsCurrency } from '@models/crypto';
import style from './style.module.scss';

interface CoinPortfolioPositionProps {
    /** id монеты в CoinGecko (bitcoin/ethereum/solana). */
    coinId: string;
    vs: VsCurrency;
}

const vsCode = (vs: VsCurrency) => (vs === 'usd' ? 'USD' : 'RUB');
const signPct = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}%`;
const toneClass = (v: number) => (v > 0 ? style.up : v < 0 ? style.down : style.flat);

interface RowProps {
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    valueClass?: string;
    hint?: string;
}

const Row: React.FC<RowProps> = ({ label, value, sub, valueClass, hint }) => (
    <div className={style.pfRow}>
        <span className={style.pfLabel}>
            {label}
            {hint && (
                <Tooltip title={hint}>
                    <InfoCircleOutlined className={style.pfHint} />
                </Tooltip>
            )}
        </span>
        <span className={style.pfValue}>
            <span className={valueClass}>{value}</span>
            {sub && <span className={style.pfSub}>{sub}</span>}
        </span>
    </div>
);

/**
 * Блок «В портфеле» на странице монеты: если монета (BTC/ETH/SOL) есть в
 * подключённых Trezor-холдингах — показываем количество, стоимость и изменение
 * за день. Иначе (не та сеть / не подключено / нет баланса) — ничего.
 * Себестоимости у кошелька нет, поэтому «прибыль» здесь не считаем — только «за день».
 */
const CoinPortfolioPosition: React.FC<CoinPortfolioPositionProps> = ({ coinId, vs }) => {
    const config = trezorCoinByCoingeckoId(coinId);
    const { positions, isLoading, hasAccounts } = useCryptoPositions();

    // Монета вне поддерживаемых сетей — блока быть не может.
    if (!config) return null;

    const position = positions.find((p) => p.ticker === config.key);

    // Ещё грузим балансы подключённого кошелька — покажем скелет, чтобы блок не мигал.
    if (!position && isLoading && hasAccounts) {
        return (
            <section className={style.card}>
                <Skeleton active paragraph={{ rows: 3 }} />
            </section>
        );
    }

    // Монеты нет в портфеле (или кошелёк не подключён) — секцию не показываем.
    if (!position) return null;

    const code = vsCode(vs);
    const sym = config.currency;
    const value = vs === 'usd' ? position.usd?.value ?? 0 : position.priceInPorfolio ?? 0;
    const perCoin = vs === 'usd' ? position.usd?.price ?? 0 : position.currentPrice ?? 0;
    const altValue =
        vs === 'usd'
            ? formatAmount(position.priceInPorfolio ?? 0, 'RUB', { compact: true })
            : formatAmount(position.usd?.value ?? 0, 'USD', { compact: true });

    // «За день»: dailyYield хранится в ₽; % одинаков в любой валюте.
    const dayRub = position.dailyYield ?? 0;
    const prevRub = (position.priceInPorfolio ?? 0) - dayRub;
    const dayPct = prevRub > 0 ? (dayRub / prevRub) * 100 : 0;
    const dayVs = value * (dayPct / 100);

    return (
        <section className={style.card}>
            <div className={style.pfHead}>
                <h2 className={style.sectionTitle}>В портфеле</h2>
                <Tag bordered={false} className={style.pfQtyTag}>
                    {position.quantity} {sym}
                </Tag>
            </div>

            <Row label='Стоимость' value={formatAmount(value, code)} sub={`≈ ${altValue}`} />
            <Row
                label='За день'
                value={formatAmount(dayVs, code, { signed: true })}
                sub={signPct(dayPct)}
                valueClass={toneClass(dayVs)}
            />
            <Row label='Цена монеты' value={formatAmount(perCoin, code)} />
            {position.stakedQuantity ? (
                <Row
                    label='В стейкинге'
                    value={`${position.stakedQuantity} ${sym}`}
                    hint='Часть баланса в стейкинге (входит в общее количество выше).'
                />
            ) : null}
        </section>
    );
};
export default CoinPortfolioPosition;
