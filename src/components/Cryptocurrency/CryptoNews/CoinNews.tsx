'use client';
import React from 'react';
import { Skeleton } from 'antd';
import { RiseOutlined, FallOutlined, MinusOutlined } from '@ant-design/icons';
import { useCoinNews } from '@/hooks/useCrypto';
import { formatTimeAgo } from '@/utils/dateUtils';
import type { INewsItem, NewsSentiment } from '@models/crypto';
import style from './style.module.scss';

const SENTIMENT: Record<NewsSentiment, { label: string; icon: React.ReactNode; cls: string }> = {
    bullish: { label: 'Рост', icon: <RiseOutlined />, cls: style.bull },
    bearish: { label: 'Падение', icon: <FallOutlined />, cls: style.bear },
    neutral: { label: 'Нейтрально', icon: <MinusOutlined />, cls: style.neu }
};

const NewsRow: React.FC<{ item: INewsItem }> = ({ item }) => {
    const s = SENTIMENT[item.sentiment ?? 'neutral'];
    return (
        <a
            className={`${style.row} ${s.cls}`}
            href={item.url}
            target='_blank'
            rel='noopener noreferrer'
        >
            <span className={style.rail} />
            <div className={style.rowBody}>
                <div className={style.rowMeta}>
                    <span className={style.sentiment}>
                        {s.icon}
                        {s.label}
                    </span>
                    <span className={style.rowSource}>{item.source}</span>
                    <span className={style.dot} />
                    <time className={style.time}>{formatTimeAgo(item.publishedAt)}</time>
                </div>
                <p className={style.rowTitle}>{item.title}</p>
            </div>
        </a>
    );
};

/** Лента новостей по монете (CryptoPanic по тикеру, с метками тональности). */
const CoinNews: React.FC<{ symbol: string }> = ({ symbol }) => {
    const { data = [], isLoading, isError } = useCoinNews(symbol);

    if (isError) return null;

    return (
        <section className={style.coinSection}>
            <header className={style.coinHead}>
                <h2 className={style.title}>Новости {symbol}</h2>
                <span className={style.headHint}>Тональность — CryptoPanic</span>
            </header>

            {isLoading ? (
                <div className={style.coinList}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton.Node active key={i} className={style.skeletonRow} />
                    ))}
                </div>
            ) : data.length === 0 ? (
                <div className={style.empty}>Свежих новостей по {symbol} пока нет.</div>
            ) : (
                <div className={style.coinList}>
                    {data.slice(0, 12).map((item) => (
                        <NewsRow key={item.id} item={item} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default CoinNews;
