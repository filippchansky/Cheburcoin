'use client';
import React from 'react';
import Link from 'next/link';
import { Skeleton, Tag } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { useFuture } from '@/hooks/useFutures';
import InstrumentLayout, {
    InstrumentMetric,
    InstrumentTab
} from '@/components/InstrumentLayout/InstrumentLayout';
import { FUTURE_GROUP_COLOR, FUTURE_GROUP_LABEL } from '@api/moex/futures/futureGroup';
import { formatPercent, intToRubCompact, intToGrouped } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/dateUtils';
import FutureChart from './FutureChart/FutureChart';
import FutureTermStructure from './FutureTermStructure/FutureTermStructure';
import FutureProfile from './FutureProfile/FutureProfile';
import style from './style.module.scss';

interface FutureDetailProps {
    secid: string;
}

const FutureDetail: React.FC<FutureDetailProps> = ({ secid }) => {
    const { data: future, isLoading, isError } = useFuture(secid);

    if (isLoading) {
        return (
            <div className={style.page}>
                <Skeleton active paragraph={{ rows: 6 }} />
            </div>
        );
    }

    if (isError || !future) {
        return (
            <div className={style.page}>
                <Link href='/futures' className={style.back}>
                    <LeftOutlined /> К списку фьючерсов
                </Link>
                <p className={style.notFound}>Контракт не найден.</p>
            </div>
        );
    }

    const formatPrice = (value: number | null) =>
        value === null
            ? '—'
            : value.toLocaleString('ru-RU', {
                  minimumFractionDigits: future.decimals,
                  maximumFractionDigits: future.decimals
              });

    const changeClass =
        future.dayChangePercent > 0 ? style.up : future.dayChangePercent < 0 ? style.down : '';

    const priceText = formatPrice(future.last);

    const metrics: InstrumentMetric[] = [
        {
            label: 'Экспирация',
            value: future.isPerpetual ? 'вечный' : formatDate(future.expiry),
            hint: future.isPerpetual
                ? 'Вечный фьючерс — торгуется непрерывно, без даты исполнения.'
                : 'Дата исполнения (последний торговый день) контракта.'
        },
        {
            label: 'Открытый интерес',
            value: intToGrouped(future.openPosition),
            hint: 'Число открытых позиций по контракту — мера ликвидности.'
        },
        {
            label: 'Оборот за день',
            value: future.valToday > 0 ? intToRubCompact(future.valToday) : '—'
        },
        {
            label: 'Объём за день',
            value: future.volToday > 0 ? `${intToGrouped(future.volToday)} шт.` : '—',
            hint: 'Объём торгов за день в контрактах.'
        },
        {
            label: 'Лот',
            value: intToGrouped(future.lot),
            hint: 'Сколько единиц базового актива приходится на один контракт.'
        },
        {
            label: 'Шаг цены',
            value: `${future.minStep} → ${future.stepPrice.toLocaleString('ru-RU')} ₽`,
            hint: 'Минимальный шаг цены и его стоимость в рублях.'
        }
    ];
    if (future.initialMargin > 0) {
        metrics.push({
            label: 'Гар. обеспечение',
            value: intToRubCompact(future.initialMargin),
            hint: 'Залог, который биржа резервирует под один контракт.'
        });
    }

    const tabs: InstrumentTab[] = [
        {
            key: 'chart',
            label: 'График',
            children: <FutureChart secid={future.secid} decimals={future.decimals} />
        },
        {
            key: 'term',
            label: 'Другие контракты',
            children: (
                <FutureTermStructure assetCode={future.assetCode} currentSecid={future.secid} />
            )
        },
        {
            key: 'about',
            label: 'О контракте',
            children: <FutureProfile future={future} />
        }
    ];

    return (
        <InstrumentLayout
            backHref='/futures'
            backLabel='К списку фьючерсов'
            title={future.shortName}
            subtitle={`${future.secid} · ${future.assetCode}`}
            tags={
                <>
                    <Tag color={FUTURE_GROUP_COLOR[future.group]} bordered={false}>
                        {FUTURE_GROUP_LABEL[future.group]}
                    </Tag>
                    {future.isPerpetual && <Tag bordered={false}>Вечный</Tag>}
                </>
            }
            price={
                <>
                    <span className={style.price}>{priceText}</span>
                    <span className={`${style.change} ${changeClass}`}>
                        {formatPercent(future.dayChangePercent)}
                    </span>
                </>
            }
            stickyPrice={
                <>
                    <span className={style.stickyPriceValue}>{priceText}</span>
                    <span className={`${style.stickyChange} ${changeClass}`}>
                        {formatPercent(future.dayChangePercent)}
                    </span>
                </>
            }
            metrics={metrics}
            tabs={tabs}
        />
    );
};
export default FutureDetail;
