'use client';
import React, { useState } from 'react';
import { Tooltip } from 'antd';
import {
    CheckOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    FallOutlined,
    LinkOutlined,
    PlusOutlined,
    RiseOutlined,
    SafetyCertificateOutlined,
    StopOutlined,
    UpOutlined
} from '@ant-design/icons';
import { IBondRatingAction, IBondRatings } from '@models/bond';
import { ratingTier } from '@/utils/bondLabels';
import { formatDate } from '@/utils/dateUtils';
import style from './style.module.scss';

interface BondRatingProps {
    ratings?: IBondRatings;
}

/** Иконка по коду рейтингового действия ЦБ (коды как в репозитарии: AF/DG/NWR/…). */
const actionIcon = (code: string): React.ReactNode => {
    switch (code) {
        case 'UP':
            return <RiseOutlined />;
        case 'DG':
            return <FallOutlined />;
        case 'AF':
            return <CheckOutlined />;
        case 'NW':
            return <PlusOutlined />;
        case 'RWR':
            return <EyeInvisibleOutlined />;
        case 'NWR':
        case 'EWR':
            return <EyeOutlined />;
        case 'WD':
            return <StopOutlined />;
        default:
            return null;
    }
};

/** Строка «последнее действие · дата · пресс-релиз». */
const ActionLine: React.FC<{ action: IBondRatingAction }> = ({ action }) => (
    <span className={style.action}>
        <span className={style.actionIcon}>{actionIcon(action.actionCode)}</span>
        {action.action && <span>{action.action}</span>}
        <span className={style.dot}>·</span>
        <span>{formatDate(action.date)}</span>
        {action.url && (
            <a
                className={style.release}
                href={action.url}
                target='_blank'
                rel='noopener noreferrer'
                onClick={(e) => e.stopPropagation()}
            >
                пресс-релиз <LinkOutlined />
            </a>
        )}
    </span>
);

const BondRating: React.FC<BondRatingProps> = ({ ratings }) => {
    const [showHistory, setShowHistory] = useState(false);

    if (!ratings || ratings.current.length === 0) return null;

    const hasHistory = ratings.history.length > 1;

    return (
        <section className={style.card}>
            <div className={style.header}>
                <SafetyCertificateOutlined className={style.headerIcon} />
                <span className={style.title}>Кредитный рейтинг</span>
                <span className={style.source}>Источник: Банк России</span>
            </div>

            {ratings.current.map((action) => (
                <div key={action.agency} className={style.row}>
                    <span className={style.agency}>{action.agency}</span>
                    <span className={`${style.value} ${style[ratingTier(action)]}`}>
                        {action.withdrawn ? 'отозван' : action.value}
                    </span>
                    <span className={style.outlook}>
                        {action.outlook ? `прогноз: ${action.outlook.toLowerCase()}` : 'прогноз не указан'}
                    </span>
                    <ActionLine action={action} />
                </div>
            ))}

            {hasHistory && (
                <>
                    <button
                        type='button'
                        className={style.toggle}
                        onClick={() => setShowHistory((v) => !v)}
                        aria-expanded={showHistory}
                    >
                        <UpOutlined className={showHistory ? style.chevOpen : style.chev} />
                        {showHistory ? 'Скрыть историю рейтинга' : `История рейтинга · ${ratings.history.length}`}
                    </button>

                    {showHistory && (
                        <ol className={style.timeline}>
                            {ratings.history.map((action, i) => (
                                <li key={`${action.date}-${action.agency}-${i}`} className={style.titem}>
                                    <span className={style.tIcon}>{actionIcon(action.actionCode)}</span>
                                    <div className={style.tBody}>
                                        <div className={style.tHead}>
                                            <span className={style.tAction}>{action.action || '—'}</span>
                                            {!action.withdrawn && (
                                                <span className={`${style.tValue} ${style[ratingTier(action)]}`}>
                                                    {action.value}
                                                </span>
                                            )}
                                        </div>
                                        <div className={style.tMeta}>
                                            {action.agency} · {formatDate(action.date)}
                                            {action.url && (
                                                <>
                                                    {' · '}
                                                    <a
                                                        href={action.url}
                                                        target='_blank'
                                                        rel='noopener noreferrer'
                                                        className={style.release}
                                                    >
                                                        пресс-релиз <LinkOutlined />
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                </>
            )}
        </section>
    );
};

export default BondRating;
