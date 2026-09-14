'use client';
import React from 'react';
import Link from 'next/link';
import { Skeleton, Tag } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { useIndex } from '@/hooks/useIndices';
import InstrumentLayout, {
    InstrumentMetric,
    InstrumentTab
} from '@/components/InstrumentLayout/InstrumentLayout';
import { INDEX_GROUP_COLOR, INDEX_GROUP_LABEL } from '@api/moex/indices/indexGroup';
import { formatPercent, intToRubCompact } from '@/utils/formatCurrency';
import IndexChart from './IndexChart/IndexChart';
import IndexComposition from './IndexComposition/IndexComposition';
import IndexProfile from './IndexProfile/IndexProfile';
import style from './style.module.scss';

interface IndexDetailProps {
    secid: string;
}

/** Группы, у которых есть публикуемый состав корзины (акции/облигации). */
const HAS_COMPOSITION = new Set(['main', 'sector', 'bonds']);

const IndexDetail: React.FC<IndexDetailProps> = ({ secid }) => {
    const { data: index, isLoading, isError } = useIndex(secid);

    if (isLoading) {
        return (
            <div className={style.page}>
                <Skeleton active paragraph={{ rows: 6 }} />
            </div>
        );
    }

    if (isError || !index) {
        return (
            <div className={style.page}>
                <Link href='/indices' className={style.back}>
                    <LeftOutlined /> К списку индексов
                </Link>
                <p className={style.notFound}>Индекс не найден.</p>
            </div>
        );
    }

    const formatValue = (value: number | null) =>
        value === null
            ? '—'
            : value.toLocaleString('ru-RU', {
                  minimumFractionDigits: index.decimals,
                  maximumFractionDigits: index.decimals
              });

    const changeClass =
        index.dayChangePercent > 0 ? style.up : index.dayChangePercent < 0 ? style.down : '';

    const valueText = formatValue(index.value);

    const metrics: InstrumentMetric[] = [
        { label: 'За месяц', value: formatPercent(index.monthChangePercent) },
        { label: 'За год', value: formatPercent(index.yearChangePercent) },
        { label: 'Годовой максимум', value: formatValue(index.annualHigh) },
        { label: 'Годовой минимум', value: formatValue(index.annualLow) },
        {
            label: 'Оборот за день',
            value: index.valToday > 0 ? intToRubCompact(index.valToday) : '—',
            hint: 'Суммарный оборот бумаг, входящих в индекс, за торговый день.'
        }
    ];
    if (index.capitalization > 0) {
        metrics.push({
            label: 'Капитализация',
            value: intToRubCompact(index.capitalization),
            hint: 'Суммарная капитализация бумаг корзины индекса.'
        });
    }

    const tabs: InstrumentTab[] = [
        {
            key: 'chart',
            label: 'График',
            children: <IndexChart secid={index.secid} decimals={index.decimals} />
        }
    ];
    if (HAS_COMPOSITION.has(index.group)) {
        tabs.push({
            key: 'composition',
            label: 'Состав',
            children: <IndexComposition secid={index.secid} />
        });
    }
    tabs.push({
        key: 'about',
        label: 'О индексе',
        children: <IndexProfile index={index} />
    });

    return (
        <InstrumentLayout
            backHref='/indices'
            backLabel='К списку индексов'
            title={index.shortName}
            subtitle={`${index.secid} · ${index.currency}`}
            tags={
                <>
                    <Tag color={INDEX_GROUP_COLOR[index.group]} bordered={false}>
                        {INDEX_GROUP_LABEL[index.group]}
                    </Tag>
                    <Tag bordered={false}>
                        {index.returnType === 'total' ? 'Полной доходности' : 'Ценовой'}
                    </Tag>
                </>
            }
            price={
                <>
                    <span className={style.price}>{valueText}</span>
                    <span className={`${style.change} ${changeClass}`}>
                        {formatPercent(index.dayChangePercent)}
                    </span>
                </>
            }
            stickyPrice={
                <>
                    <span className={style.stickyPriceValue}>{valueText}</span>
                    <span className={`${style.stickyChange} ${changeClass}`}>
                        {formatPercent(index.dayChangePercent)}
                    </span>
                </>
            }
            metrics={metrics}
            tabs={tabs}
        />
    );
};
export default IndexDetail;
