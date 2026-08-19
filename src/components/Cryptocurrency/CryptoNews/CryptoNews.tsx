'use client';
import React from 'react';
import { Skeleton } from 'antd';
import { useCryptoNews } from '@/hooks/useCrypto';
import { formatTimeAgo } from '@/utils/dateUtils';
import type { INewsItem } from '@models/crypto';
import NewsThumb from './NewsThumb';
import style from './style.module.scss';

/** Метаданные под заголовком: источник · время. */
const Meta: React.FC<{ item: INewsItem }> = ({ item }) => (
    <div className={style.meta}>
        <span className={style.source}>{item.source}</span>
        <span className={style.dot} />
        <time className={style.time}>{formatTimeAgo(item.publishedAt)}</time>
    </div>
);

/** Крупная карточка-афиша для самой свежей новости. */
const FeaturedCard: React.FC<{ item: INewsItem }> = ({ item }) => (
    <a
        className={style.featured}
        href={item.url}
        target='_blank'
        rel='noopener noreferrer'
    >
        <NewsThumb src={item.imageUrl} source={item.source} className={style.featuredThumb} />
        <div className={style.featuredBody}>
            <Meta item={item} />
            <h3 className={style.featuredTitle}>{item.title}</h3>
        </div>
    </a>
);

/** Обычная карточка ленты. */
const NewsCard: React.FC<{ item: INewsItem }> = ({ item }) => (
    <a className={style.card} href={item.url} target='_blank' rel='noopener noreferrer'>
        <NewsThumb src={item.imageUrl} source={item.source} className={style.cardThumb} />
        <div className={style.cardBody}>
            <Meta item={item} />
            <h4 className={style.cardTitle}>{item.title}</h4>
        </div>
    </a>
);

const CryptoNews: React.FC = () => {
    const { data = [], isLoading, isError } = useCryptoNews();

    if (isError) return null;

    const [featured, ...rest] = data;
    const grid = rest.slice(0, 9);

    return (
        <section className={style.section}>
            <header className={style.head}>
                <div className={style.headTitle}>
                    <span className={style.live} />
                    <h2 className={style.title}>Новости рынка</h2>
                </div>
                <span className={style.headHint}>Русские крипто-издания</span>
            </header>

            {isLoading ? (
                <div className={style.skeletonWrap}>
                    <Skeleton.Node active className={style.skeletonFeatured} />
                    <div className={style.grid}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton.Node active key={i} className={style.skeletonCard} />
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {featured && <FeaturedCard item={featured} />}
                    <div className={style.grid}>
                        {grid.map((item) => (
                            <NewsCard key={item.id} item={item} />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
};

export default CryptoNews;
