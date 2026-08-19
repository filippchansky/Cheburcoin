'use client';
import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Alert, Avatar, Segmented, Skeleton, Tag, Typography } from 'antd';
import {
    GlobalOutlined,
    TwitterOutlined,
    RedditOutlined,
    LinkOutlined
} from '@ant-design/icons';
import { useCoinChart, useCoinDetail } from '@/hooks/useCrypto';
import { useVsCurrency } from '@/store/vsCurrency';
import { formatAmount, formatPercent } from '@/utils/formatCurrency';
import type { ChartPeriod, VsCurrency } from '@models/crypto';
import CoinChart from './CoinChart';
import CoinStats from './CoinStats';
import CoinPortfolioPosition from './CoinPortfolioPosition';
import CoinNews from '../CryptoNews/CoinNews';
import style from './style.module.scss';

const vsCode = (vs: VsCurrency) => (vs === 'usd' ? 'USD' : 'RUB');

const PERIODS: { label: string; value: ChartPeriod }[] = [
    { label: '24Ч', value: '24h' },
    { label: '1Н', value: '1w' },
    { label: '1М', value: '1m' },
    { label: '3М', value: '3m' },
    { label: '6М', value: '6m' },
    { label: '1Г', value: '1y' },
    { label: 'Всё', value: 'all' }
];

const changeClass = (v: number | null) => {
    if (v === null || v === 0) return style.flat;
    return v > 0 ? style.up : style.down;
};

/** HTML-описание CoinGecko → плоский текст (теги вырезаем, сущности не трогаем). */
const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

const CoinDetail: React.FC = () => {
    const params = useParams();
    const slug = params.slug;
    const id = Array.isArray(slug) ? slug[0] : (slug ?? '');
    const { vs, setVs } = useVsCurrency();
    const [period, setPeriod] = useState<ChartPeriod>('1w');

    const { data: coin, isLoading, isError } = useCoinDetail(id, vs);
    const chart = useCoinChart(id, vs, period);
    const code = vsCode(vs);

    const description = useMemo(
        () => (coin?.description ? stripHtml(coin.description) : ''),
        [coin?.description]
    );

    if (isError) {
        return (
            <div className={style.page}>
                <Alert
                    type='error'
                    showIcon
                    message='Не удалось загрузить монету'
                    description='Проверьте адрес или попробуйте обновить страницу.'
                />
            </div>
        );
    }

    const links = [
        coin?.websiteUrl && { icon: <GlobalOutlined />, label: 'Сайт', url: coin.websiteUrl },
        coin?.twitterUrl && { icon: <TwitterOutlined />, label: 'Twitter', url: coin.twitterUrl },
        coin?.redditUrl && { icon: <RedditOutlined />, label: 'Reddit', url: coin.redditUrl },
        coin?.explorerUrl && { icon: <LinkOutlined />, label: 'Обозреватель', url: coin.explorerUrl }
    ].filter(Boolean) as { icon: React.ReactNode; label: string; url: string }[];

    return (
        <div className={style.page}>
            {/* Hero */}
            <div className={style.hero}>
                {isLoading || !coin ? (
                    <Skeleton avatar active paragraph={{ rows: 2 }} />
                ) : (
                    <>
                        <div className={style.heroHead}>
                            <Avatar src={coin.icon} size={56}>
                                {coin.symbol.slice(0, 3)}
                            </Avatar>
                            <div className={style.heroTitle}>
                                <h1 className={style.name}>
                                    {coin.name}
                                    <span className={style.symbol}>{coin.symbol}</span>
                                </h1>
                                {coin.rank && <Tag className={style.rankTag}>#{coin.rank}</Tag>}
                            </div>
                            <div className={style.currencyToggle}>
                                <Segmented<VsCurrency>
                                    value={vs}
                                    onChange={setVs}
                                    options={[
                                        { label: '$', value: 'usd' },
                                        { label: '₽', value: 'rub' }
                                    ]}
                                />
                            </div>
                        </div>
                        <div className={style.priceRow}>
                            <span className={style.price}>{formatAmount(coin.price, code)}</span>
                            <span className={`${style.change} ${changeClass(coin.priceChange24h)}`}>
                                {coin.priceChange24h === null
                                    ? '—'
                                    : formatPercent(coin.priceChange24h)}
                                <span className={style.changeLabel}>за 24ч</span>
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* График */}
            <div className={style.card}>
                <div className={style.chartHead}>
                    <Segmented<ChartPeriod>
                        value={period}
                        onChange={setPeriod}
                        options={PERIODS}
                    />
                </div>
                <CoinChart
                    prices={chart.data?.prices ?? []}
                    period={period}
                    vs={vs}
                    loading={chart.isLoading}
                />
            </div>

            {/* Статистика */}
            {coin && <CoinStats coin={coin} vs={vs} />}

            {/* В портфеле (Trezor BTC/ETH/SOL) */}
            {id && <CoinPortfolioPosition coinId={id} vs={vs} />}

            {/* Ссылки */}
            {links.length > 0 && (
                <div className={style.links}>
                    {links.map((l) => (
                        <a
                            key={l.label}
                            className={style.linkChip}
                            href={l.url}
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            {l.icon}
                            {l.label}
                        </a>
                    ))}
                </div>
            )}

            {/* Описание */}
            {description && (
                <div className={style.card}>
                    <h2 className={style.sectionTitle}>О проекте</h2>
                    <Typography.Paragraph
                        className={style.description}
                        ellipsis={{ rows: 4, expandable: true, symbol: 'ещё' }}
                    >
                        {description}
                    </Typography.Paragraph>
                </div>
            )}

            {/* Новости по монете (CryptoPanic по тикеру) */}
            {coin && <CoinNews symbol={coin.symbol} />}
        </div>
    );
};
export default CoinDetail;
