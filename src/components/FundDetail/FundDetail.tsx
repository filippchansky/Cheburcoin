'use client';
import React from 'react';
import Link from 'next/link';
import { Skeleton, Tag, Tooltip } from 'antd';
import { InfoCircleOutlined, LeftOutlined } from '@ant-design/icons';
import { useFundDetail } from '@/hooks/useFundDetail';
import { FUND_CATEGORY_COLOR, FUND_CATEGORY_LABEL } from '@api/moex/funds/fundCategory';
import ShareLogo from '@/components/ShareLogo/ShareLogo';
import { formatMoney, formatPercent, intToCompact, intToRubCompact } from '@/utils/formatCurrency';
import FundPriceRange from './FundPriceRange/FundPriceRange';
import FundChart from './FundChart/FundChart';
import FundCalculator from './FundCalculator/FundCalculator';
import FundProfile from './FundProfile/FundProfile';
import style from './style.module.scss';

interface FundDetailProps {
    ticker: string;
}

const listLevelHint =
    'Уровень листинга MOEX: 1 — высшая котировальная группа (самые надёжные и ликвидные), 3 — некотировальная часть.';
const spreadHint = 'Лучшие цены покупки (bid) и продажи (offer) в стакане. Прочерк — после закрытия торгов.';
const categoryHint =
    'Класс активов фонда выведен из его названия — в бесплатных данных MOEX готовой классификации нет, поэтому у отдельных фондов возможна неточность.';

/** Убираем служебный префикс «БПИФ » из полного имени для заголовка. */
const cleanName = (name: string) => name.replace(/^БПИФ\s+/i, '').trim();

const FundDetail: React.FC<FundDetailProps> = ({ ticker }) => {
    const { data: fund, isLoading, isError } = useFundDetail(ticker);

    if (isLoading) {
        return (
            <div className={style.page}>
                <Skeleton active paragraph={{ rows: 6 }} />
            </div>
        );
    }

    if (isError || !fund) {
        return (
            <div className={style.page}>
                <Link href='/funds' className={style.back}>
                    <LeftOutlined /> К списку фондов
                </Link>
                <p className={style.notFound}>Фонд не найден или сейчас не торгуется.</p>
            </div>
        );
    }

    const money = (value: number | null) =>
        value === null ? '—' : formatMoney(value, fund.currency);

    const changeClass =
        fund.dayChangePercent > 0 ? style.up : fund.dayChangePercent < 0 ? style.down : '';

    const dayRange =
        fund.dayLow === null || fund.dayHigh === null
            ? '—'
            : `${money(fund.dayLow)} — ${money(fund.dayHigh)}`;

    const metrics: { label: string; value: React.ReactNode; hint?: string }[] = [
        {
            label: 'Оборот за день',
            value: fund.valueToday === null ? '—' : intToRubCompact(fund.valueToday),
            hint: 'Сумма сделок за день — главный показатель ликвидности фонда.'
        },
        {
            label: 'Объём за день',
            value: fund.volumeToday === null ? '—' : `${intToCompact(fund.volumeToday)} паёв`
        },
        {
            label: 'Сделок за день',
            value: fund.numTrades === null ? '—' : intToCompact(fund.numTrades)
        },
        {
            label: 'Средневзв. цена',
            value: money(fund.waPrice),
            hint: 'Средневзвешенная цена пая за сегодняшний торговый день.'
        },
        { label: 'Открытие', value: money(fund.open) },
        { label: 'Диапазон дня', value: dayRange },
        {
            label: 'Спред bid / ask',
            value:
                fund.bid === null || fund.offer === null
                    ? '—'
                    : `${money(fund.bid)} / ${money(fund.offer)}`,
            hint: spreadHint
        },
        {
            label: 'Уровень листинга',
            value: fund.listLevel === null ? '—' : `${fund.listLevel} ур.`,
            hint: listLevelHint
        }
    ];

    return (
        <div className={style.page}>
            <Link href='/funds' className={style.back}>
                <LeftOutlined /> К списку фондов
            </Link>

            <header className={style.header}>
                <div className={style.titleBlock}>
                    <div className={style.titleRow}>
                        <ShareLogo icon={fund.isin} ticker={fund.ticker} size={48} />
                        <div>
                            <h1 className={style.title}>{cleanName(fund.fullName) || fund.ticker}</h1>
                            <span className={style.ticker}>
                                {fund.ticker} · {fund.isin}
                            </span>
                        </div>
                    </div>
                    <div className={style.tags}>
                        <Tooltip title={categoryHint}>
                            <Tag color={FUND_CATEGORY_COLOR[fund.category]} bordered={false}>
                                {FUND_CATEGORY_LABEL[fund.category]}
                            </Tag>
                        </Tooltip>
                        <Tag bordered={false}>Биржевой фонд</Tag>
                        {fund.listLevel !== null && (
                            <Tooltip title={listLevelHint}>
                                <Tag bordered={false}>{fund.listLevel} ур. листинга</Tag>
                            </Tooltip>
                        )}
                        {fund.forQualified && (
                            <Tag color='volcano' bordered={false}>
                                Только для квалов
                            </Tag>
                        )}
                    </div>
                </div>

                <div className={style.priceBlock}>
                    <span className={style.price}>{money(fund.price)}</span>
                    <span className={`${style.change} ${changeClass}`}>
                        {fund.dayChange > 0 ? '+' : ''}
                        {money(fund.dayChange)} · {formatPercent(fund.dayChangePercent)}
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

            <FundPriceRange ticker={fund.ticker} price={fund.price} currency={fund.currency} />
            <FundChart ticker={fund.ticker} />
            <FundCalculator fund={fund} />
            <FundProfile fund={fund} />
        </div>
    );
};
export default FundDetail;
