'use client';
import React from 'react';
import Link from 'next/link';
import { Skeleton, Tag, Tooltip } from 'antd';
import { InfoCircleOutlined, LeftOutlined } from '@ant-design/icons';
import { useBond, useBondAmortizations, useBondFlags, useBondRatings } from '@/hooks/useBonds';
import { formatMoney } from '@/utils/formatCurrency';
import { formatDate, yearsUntil } from '@/utils/dateUtils';
import { couponPeriodLabel, couponTag, defaultBadge, reliabilityInfo } from '@/utils/bondLabels';
import BondRating from './BondRating/BondRating';
import KeyRateCompare from './KeyRateCompare/KeyRateCompare';
import BondCalculator from './BondCalculator/BondCalculator';
import BondChart from './BondChart/BondChart';
import CouponsTable from './CouponsTable/CouponsTable';
import AmortizationTable from './AmortizationTable/AmortizationTable';
import style from './style.module.scss';

interface BondDetailProps {
    secid: string;
}

const BondDetail: React.FC<BondDetailProps> = ({ secid }) => {
    const { data: bond, isLoading, isError } = useBond(secid);
    const { data: amortizations = [] } = useBondAmortizations(secid);
    const { data: flags } = useBondFlags();
    const { data: ratingsMap } = useBondRatings();
    const amortizes = amortizations.length > 0;

    if (isLoading) {
        return (
            <div className={style.page}>
                <Skeleton active paragraph={{ rows: 6 }} />
            </div>
        );
    }

    if (isError || !bond) {
        return (
            <div className={style.page}>
                <Link href='/bonds' className={style.back}>
                    <LeftOutlined /> К списку облигаций
                </Link>
                <p className={style.notFound}>Облигация не найдена или недоступна.</p>
            </div>
        );
    }

    const years = yearsUntil(bond.maturityDate);
    const tag = couponTag[bond.couponType];
    // Кредитный рейтинг (карта ЦБ: secid → ИНН → рейтинг эмитента). Питает и плитку «Надёжность».
    const ratingInn = ratingsMap?.secids[bond.secid];
    const ratings = ratingInn ? ratingsMap?.issuers[ratingInn] : undefined;
    const topRating = ratings?.current.find((a) => !a.withdrawn)?.value ?? null;
    const reliability = reliabilityInfo({ ...bond, creditRating: topRating });
    // Флаги дефолта карточка MOEX не отдаёт — берём из статической карты по secid.
    const flag = flags?.[bond.secid];
    const defBadge = defaultBadge({
        ...bond,
        hasDefault: flag?.hasDefault,
        hasTechnicalDefault: flag?.hasTechnicalDefault
    });

    const metrics: { label: string; value: React.ReactNode; hint?: string }[] = [
        {
            label: 'Доходность',
            value: bond.yield === null ? '—' : `${bond.yield.toFixed(2)}%`,
            hint: 'Эффективная доходность к погашению по данным MOEX: предполагает реинвестирование купонов под ту же ставку.'
        },
        {
            label: 'Купон',
            value:
                bond.couponPercent === null
                    ? 'плавающий'
                    : `${bond.couponPercent.toFixed(2)}% · ${formatMoney(bond.couponValue, bond.currency)}`
        },
        {
            label: 'Текущая купонная доходность',
            value:
                bond.couponYieldToNominal === null
                    ? '—'
                    : `${bond.couponYieldToPrice !== null ? `${bond.couponYieldToPrice.toFixed(2)}%` : ''}`
        },
        {
            label: 'Погашение',
            value: `${formatDate(bond.maturityDate)}${years !== null ? ` · через ${years.toFixed(1)} г.` : ''}`
        },
        {
            label: 'Дюрация',
            value: bond.duration === null ? '—' : `${(bond.duration / 365).toFixed(1)} г.`
        },
        { label: 'НКД', value: formatMoney(bond.accruedInt, bond.currency) },
        { label: 'Номинал', value: formatMoney(bond.faceValue, bond.currency) },
        { label: 'Периодичность купона', value: couponPeriodLabel(bond.couponPeriod) },
        {
            label: 'Надёжность',
            value: (
                <Tag color={reliability.color} bordered={false}>
                    {reliability.label}
                </Tag>
            ),
            hint: reliability.tooltip
        }
    ];

    return (
        <div className={style.page}>
            <Link href='/bonds' className={style.back}>
                <LeftOutlined /> К списку облигаций
            </Link>

            <header className={style.header}>
                <div className={style.titleBlock}>
                    <div className={style.titleRow}>
                        <h1 className={style.title}>{bond.shortName}</h1>
                        {defBadge && (
                            <Tooltip title={defBadge.tooltip}>
                                <Tag color={defBadge.color} bordered={false}>
                                    {defBadge.label}
                                </Tag>
                            </Tooltip>
                        )}
                    </div>
                    <div className={style.tags}>
                        <Tag color={tag.color} bordered={false}>
                            {tag.label}
                        </Tag>
                        {amortizes && (
                            <Tag color='purple' bordered={false}>
                                Амортизация
                            </Tag>
                        )}
                        {bond.hasOffer && (
                            <Tag color='volcano' bordered={false}>
                                Оферта
                            </Tag>
                        )}
                        <span className={style.isin}>{bond.isin}</span>
                    </div>
                </div>

                <div className={style.priceBlock}>
                    {bond.priceValue !== null && (
                        <span className={style.price}>
                            {formatMoney(bond.priceValue, bond.currency)}
                        </span>
                    )}
                    <span className={style.priceRub}>
                        {bond.pricePercent === null ? '—' : `${bond.pricePercent.toFixed(2)}%`}
                    </span>
                </div>
            </header>

            <div className={style.metrics}>
                {metrics.map((metric) => (
                    <div key={metric.label} className={style.tile}>
                        <span className={style.tileLabel}>
                            {metric.label}
                            {metric.hint && (
                                <Tooltip title={metric.hint}>
                                    <InfoCircleOutlined className={style.hint} />
                                </Tooltip>
                            )}
                        </span>
                        <span className={style.tileValue}>{metric.value}</span>
                    </div>
                ))}
            </div>

            <BondRating ratings={ratings} />

            <KeyRateCompare bondYield={bond.yield} />
            <BondCalculator bond={bond} />
            <BondChart secid={bond.secid} />
            <CouponsTable secid={bond.secid} currency={bond.currency} />
            <AmortizationTable amortizations={amortizations} currency={bond.currency} />
        </div>
    );
};
export default BondDetail;
