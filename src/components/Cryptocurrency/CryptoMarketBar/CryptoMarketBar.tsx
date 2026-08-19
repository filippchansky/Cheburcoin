'use client';
import React from 'react';
import { GlobalOutlined, BarChartOutlined, PieChartOutlined, DashboardOutlined } from '@ant-design/icons';
import { IndicatorTile } from '@/components/HomePage/IndicatorRibbon';
import { formatAmount } from '@/utils/formatCurrency';
import { useCryptoGlobal, useFng } from '@/hooks/useCrypto';
import type { VsCurrency } from '@models/crypto';
import style from './style.module.scss';

const vsCode = (vs: VsCurrency) => (vs === 'usd' ? 'USD' : 'RUB');

/** Перевод классификации alternative.me (её же бэнды, что и у общеизвестного индекса). */
const FNG_LABELS: Record<string, string> = {
    'Extreme Fear': 'Крайний страх',
    Fear: 'Страх',
    Neutral: 'Нейтрально',
    Greed: 'Жадность',
    'Extreme Greed': 'Крайняя жадность'
};

const fngLabel = (classification: string): string => FNG_LABELS[classification] ?? classification;

interface CryptoMarketBarProps {
    vs: VsCurrency;
}

/** Верхняя полоса крипторынка: капа, объём, доминация BTC, индекс страха и жадности. */
const CryptoMarketBar: React.FC<CryptoMarketBarProps> = ({ vs }) => {
    const global = useCryptoGlobal(vs);
    const fng = useFng();
    const code = vsCode(vs);

    return (
        <div className={style.ribbon}>
            <IndicatorTile
                label='Капитализация рынка'
                icon={<GlobalOutlined />}
                loading={global.isLoading}
                value={
                    global.data
                        ? formatAmount(global.data.marketCap, code, { compact: true })
                        : undefined
                }
                change={global.data?.marketCapChange24h}
            />
            <IndicatorTile
                label='Объём 24ч'
                icon={<BarChartOutlined />}
                loading={global.isLoading}
                value={
                    global.data
                        ? formatAmount(global.data.volume, code, { compact: true })
                        : undefined
                }
                sub='за сутки'
            />
            <IndicatorTile
                label='Доминация BTC'
                icon={<PieChartOutlined />}
                loading={global.isLoading}
                value={global.data ? `${global.data.btcDominance.toFixed(1)}%` : undefined}
                sub={global.data ? `ETH ${global.data.ethDominance.toFixed(1)}%` : undefined}
            />
            <IndicatorTile
                label='Индекс страха и жадности'
                icon={<DashboardOutlined />}
                loading={fng.isLoading}
                value={fng.data ? String(fng.data.value) : undefined}
                sub={fng.data ? fngLabel(fng.data.classification) : undefined}
            />
        </div>
    );
};
export default CryptoMarketBar;
