'use client';
import React from 'react';
import { useImoex } from '@/hooks/useMarketOverview';
import style from './style.module.scss';

const TIME_FMT = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });

/**
 * Живой индикатор актуальности данных: пульсирующая точка + время последнего
 * успешного обновления. Берёт метку из react-query (useImoex, refetch раз в минуту).
 */
const LiveBadge: React.FC = () => {
    const { dataUpdatedAt, isFetching, isError } = useImoex();

    if (!dataUpdatedAt && !isError) return null;

    const label = isError
        ? 'нет связи с биржей'
        : `обновлено ${TIME_FMT.format(new Date(dataUpdatedAt))}`;

    return (
        <span className={`${style.liveBadge} ${isError ? style.liveError : ''}`}>
            <span className={`${style.liveDot} ${isFetching ? style.livePulse : ''}`} />
            {label}
        </span>
    );
};

export default LiveBadge;
