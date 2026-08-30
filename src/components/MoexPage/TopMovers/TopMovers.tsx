'use client';
import { IFilteredShares } from '@models/filteredShares';
import { RiseOutlined, FallOutlined, CrownOutlined } from '@ant-design/icons';
import React from 'react';
import { formatAmount, formatPercent, intToRubCompact } from '@/utils/formatCurrency';
import MoversCard, { MoverItem } from '../../MoversCard/MoversCard';
import style from './style.module.scss';

type Metric = 'gain' | 'loss' | 'cap';

const renderMetric = (share: IFilteredShares, metric: Metric) => {
    if (metric === 'cap') return intToRubCompact(share.capitalization);
    return formatPercent(share.dayChangePercent);
};

/** Бумаги MOEX → строки карточки-топа. */
const toItems = (shares: IFilteredShares[], metric: Metric): MoverItem[] =>
    shares.map((share) => ({
        key: share.id,
        ticker: share.ticker,
        icon: share.icon,
        sub: formatAmount(share.price, share.currency),
        metric: renderMetric(share, metric),
        href: `/moex/${share.ticker}`
    }));

interface TopMoversProps {
    gainers: IFilteredShares[];
    losers: IFilteredShares[];
    topCap: IFilteredShares[];
    loading?: boolean;
}

const TopMovers: React.FC<TopMoversProps> = ({ gainers, losers, topCap, loading }) => (
    <div className={style.grid}>
        <MoversCard
            title='Лидеры роста'
            icon={<RiseOutlined />}
            accent='up'
            items={toItems(gainers, 'gain')}
            loading={loading}
            index={0}
        />
        <MoversCard
            title='Лидеры падения'
            icon={<FallOutlined />}
            accent='down'
            items={toItems(losers, 'loss')}
            loading={loading}
            index={1}
        />
        <MoversCard
            title='Крупнейшие'
            icon={<CrownOutlined />}
            accent='neutral'
            items={toItems(topCap, 'cap')}
            loading={loading}
            index={2}
        />
    </div>
);
export default TopMovers;
