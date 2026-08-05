'use client';
import React from 'react';
import Link from 'next/link';
import { Skeleton, Tag } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { useBond } from '@/hooks/useBonds';
import { formatMoney } from '@/utils/formatCurrency';
import { formatDate, yearsUntil } from '@/utils/dateUtils';
import { couponPeriodLabel, couponTag } from '@/utils/bondLabels';
import KeyRateCompare from './KeyRateCompare/KeyRateCompare';
import BondChart from './BondChart/BondChart';
import CouponsTable from './CouponsTable/CouponsTable';
import style from './style.module.scss';

interface BondDetailProps {
    secid: string;
}

const BondDetail: React.FC<BondDetailProps> = ({ secid }) => {
    const { data: bond, isLoading, isError } = useBond(secid);

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

    const metrics: { label: string; value: React.ReactNode }[] = [
        { label: 'Доходность', value: bond.yield === null ? '—' : `${bond.yield.toFixed(2)}%` },
        {
            label: 'Купон',
            value:
                bond.couponPercent === null
                    ? 'плавающий'
                    : `${bond.couponPercent.toFixed(2)}% · ${formatMoney(bond.couponValue, bond.currency)}`
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
        { label: 'Уровень листинга', value: `${bond.listLevel} уровень` }
    ];

    return (
        <div className={style.page}>
            <Link href='/bonds' className={style.back}>
                <LeftOutlined /> К списку облигаций
            </Link>

            <header className={style.header}>
                <div className={style.titleBlock}>
                    <h1 className={style.title}>{bond.shortName}</h1>
                    <div className={style.tags}>
                        <Tag color={tag.color} bordered={false}>
                            {tag.label}
                        </Tag>
                        {bond.hasAmortization && (
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
                    <span className={style.price}>
                        {bond.pricePercent === null ? '—' : `${bond.pricePercent.toFixed(2)}%`}
                    </span>
                    {bond.priceValue !== null && (
                        <span className={style.priceRub}>
                            {formatMoney(bond.priceValue, bond.currency)}
                        </span>
                    )}
                </div>
            </header>

            <div className={style.metrics}>
                {metrics.map((metric) => (
                    <div key={metric.label} className={style.tile}>
                        <span className={style.tileLabel}>{metric.label}</span>
                        <span className={style.tileValue}>{metric.value}</span>
                    </div>
                ))}
            </div>

            <KeyRateCompare bondYield={bond.yield} />
            <BondChart secid={bond.secid} />
            <CouponsTable secid={bond.secid} currency={bond.currency} />
        </div>
    );
};
export default BondDetail;
