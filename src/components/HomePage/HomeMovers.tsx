'use client';
import React from 'react';
import Link from 'next/link';
import { Skeleton } from 'antd';
import { RiseOutlined, FallOutlined } from '@ant-design/icons';
import { IFilteredShares } from '@models/filteredShares';
import { getTopGainers, getTopLosers, useShares } from '@/hooks/useShares';
import { formatPercent } from '@/utils/formatCurrency';
import ShareLogo from '../ShareLogo/ShareLogo';
import style from './style.module.scss';

/** Сколько самых оборотистых бумаг берём в расчёт (отсекает неликвидный шум). */
const LIQUID_UNIVERSE = 60;
const ROWS = 4;

const MoverRow: React.FC<{ share: IFilteredShares; accent: 'up' | 'down' }> = ({
    share,
    accent
}) => (
    <Link className={style.moverRow} href={`/moex/${share.ticker}`}>
        <ShareLogo icon={share.icon} ticker={share.ticker} size={22} />
        <span className={style.moverTicker}>{share.ticker}</span>
        <span className={`${style.moverPct} ${style[accent]}`}>
            {formatPercent(share.dayChangePercent)}
        </span>
    </Link>
);

const MoverColumn: React.FC<{
    label: string;
    icon: React.ReactNode;
    accent: 'up' | 'down';
    shares: IFilteredShares[];
}> = ({ label, icon, accent, shares }) => (
    <div className={style.moverCol}>
        <span className={`${style.moverColHead} ${style[accent]}`}>
            {icon}
            {label}
        </span>
        {shares.length ? (
            shares.map((s) => <MoverRow key={s.id} share={s} accent={accent} />)
        ) : (
            <span className={style.moverEmpty}>—</span>
        )}
    </div>
);

/** Мини-виджет «Лидеры роста и падения» среди ликвидных бумаг MOEX (топ по обороту). */
const HomeMovers: React.FC = () => {
    const { data, isLoading, isError } = useShares();

    const liquid = React.useMemo(
        () => (data ? [...data].sort((a, b) => b.valToday - a.valToday).slice(0, LIQUID_UNIVERSE) : []),
        [data]
    );

    return (
        <div className={style.widgetCard}>
            <h3 className={style.widgetTitle}>
                <RiseOutlined />
                Лидеры роста и падения
            </h3>
            {isLoading ? (
                <Skeleton active title={false} paragraph={{ rows: 4 }} />
            ) : isError || !data ? (
                <span className={style.moverEmpty}>Не удалось загрузить данные</span>
            ) : (
                <div className={style.moversGrid}>
                    <MoverColumn
                        label='Рост'
                        icon={<RiseOutlined />}
                        accent='up'
                        shares={getTopGainers(liquid, ROWS)}
                    />
                    <MoverColumn
                        label='Падение'
                        icon={<FallOutlined />}
                        accent='down'
                        shares={getTopLosers(liquid, ROWS)}
                    />
                </div>
            )}
        </div>
    );
};

export default HomeMovers;
