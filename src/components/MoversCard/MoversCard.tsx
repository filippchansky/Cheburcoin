'use client';
import { Card, Skeleton } from 'antd';
import * as motion from 'motion/react-client';
import Link from 'next/link';
import React from 'react';
import ShareLogo from '../ShareLogo/ShareLogo';
import style from './style.module.scss';

export type MoverAccent = 'up' | 'down' | 'neutral';

/** Одна строка карточки-топа: лого, тикер, подпись и значение справа. */
export interface MoverItem {
    key: string;
    ticker: string;
    /** Ключ лого (ISIN у бумаг MOEX). */
    icon: string;
    /** Прямой URL лого (крипта) — приоритетнее icon. */
    logoSrc?: string;
    /** Подпись под тикером: цена или изменение в деньгах. */
    sub?: string;
    /** Значение справа (обычно процент за день). */
    metric: string;
    /** Куда ведёт клик; null/undefined — строка некликабельна. */
    href?: string | null;
}

interface MoversCardProps {
    title: string;
    icon: React.ReactNode;
    accent: MoverAccent;
    items: MoverItem[];
    loading?: boolean;
    /** Текст, когда список пуст (и не грузится). */
    emptyText?: string;
    /** Порядковый номер карточки — задержка появления в анимации. */
    index?: number;
    /** Убрать внешнюю рамку карточки (шапка и разделитель остаются). */
    borderless?: boolean;
}

const SkeletonRow: React.FC = () => (
    <li className={style.skeletonRow}>
        <Skeleton.Avatar active size={28} shape='circle' />
        <div className={style.itemName}>
            <Skeleton.Button active size='small' style={{ width: 64, height: 14 }} />
        </div>
        <Skeleton.Button active size='small' style={{ width: 56, height: 14 }} />
    </li>
);

/** Общая карточка «топа» (лидеры роста/падения/крупнейшие) — списком строк. */
const MoversCard: React.FC<MoversCardProps> = ({
    title,
    icon,
    accent,
    items,
    loading,
    emptyText,
    index = 0,
    borderless = false
}) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.08 }}
    >
        <Card className={style.card} bordered={!borderless} styles={{ body: { padding: 0 } }}>
            <div className={`${style.cardHeader} ${style[accent]}`}>
                <span className={style.cardIcon}>{icon}</span>
                <h3 className={style.cardTitle}>{title}</h3>
            </div>
            <ul className={style.list}>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : items.length === 0 ? (
                    <li className={style.empty}>{emptyText ?? 'Нет данных'}</li>
                ) : (
                    items.map((item) => {
                        const body = (
                            <>
                                <ShareLogo
                                    icon={item.icon}
                                    ticker={item.ticker}
                                    size={28}
                                    src={item.logoSrc}
                                />
                                <div className={style.itemName}>
                                    <span className={style.itemTicker}>{item.ticker}</span>
                                    {item.sub ? (
                                        <span className={style.itemPrice}>{item.sub}</span>
                                    ) : null}
                                </div>
                                <span className={`${style.itemMetric} ${style[accent]}`}>
                                    {item.metric}
                                </span>
                            </>
                        );
                        return (
                            <li key={item.key} className={style.item}>
                                {item.href ? (
                                    <Link className={style.itemLink} href={item.href}>
                                        {body}
                                    </Link>
                                ) : (
                                    <div className={style.itemLink}>{body}</div>
                                )}
                            </li>
                        );
                    })
                )}
            </ul>
        </Card>
    </motion.div>
);
export default MoversCard;
