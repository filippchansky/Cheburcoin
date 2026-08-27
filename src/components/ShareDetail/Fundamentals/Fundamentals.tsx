'use client';
import React from 'react';
import { Skeleton, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useShareFundamentals } from '@/hooks/useShareDetail';
import { formatAmount, formatMoney } from '@/utils/formatCurrency';
import style from './style.module.scss';

interface FundamentalsProps {
    ticker: string;
}

/** Число «разом»: коэффициент без единиц (P/E, beta, долг/EBITDA). */
const ratio = (v: number | null): string => (v === null ? '—' : v.toFixed(2));

/** Процент (значение уже в процентах). `signed` — со знаком (для роста). */
const pct = (v: number | null, signed = false): string => {
    if (v === null) return '—';
    const sign = signed && v > 0 ? '+' : '';
    return `${sign}${v.toFixed(2)}%`;
};

/** Дата отсечки ISO → ДД.ММ.ГГГГ. */
const ruDate = (iso: string | null): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU');
};

interface Metric {
    label: string;
    value: string;
    hint?: string;
}

interface Group {
    title: string;
    metrics: Metric[];
}

const Fundamentals: React.FC<FundamentalsProps> = ({ ticker }) => {
    const { fundamentals: f, isLoading, noToken } = useShareFundamentals(ticker);

    if (isLoading) {
        return <Skeleton.Button active block style={{ height: 220, marginTop: 20 }} />;
    }

    // Нет токена — честная заглушка (данные фундаментала живут за токеном Т-Банка).
    if (noToken) {
        return (
            <section className={style.wrapper}>
                <div className={style.head}>
                    <h2 className={style.title}>Фундаментальные показатели</h2>
                </div>
                <p className={style.empty}>
                    Подключите Т-Банк в разделе «Источники данных», чтобы видеть
                    фундаментальные показатели бумаги.
                </p>
            </section>
        );
    }

    // Токен есть, но у бумаги нет фундаментала (фонд/валюта/делистинг).
    if (!f) return null;

    const cur = f.currency ?? 'RUB';

    const groups: Group[] = [
        {
            title: 'Оценка',
            metrics: [
                { label: 'Капитализация', value: f.marketCap === null ? '—' : formatAmount(f.marketCap, cur, { compact: true }) },
                { label: 'P/E', value: ratio(f.peRatio), hint: 'Цена / прибыль. Сколько годовых прибылей стоит компания. Ниже — «дешевле».' },
                { label: 'P/S', value: ratio(f.priceToSales), hint: 'Цена / выручка.' },
                { label: 'P/B', value: ratio(f.priceToBook), hint: 'Цена / балансовая стоимость. <1 — торгуется дешевле собственного капитала.' },
                { label: 'EV/EBITDA', value: ratio(f.evToEbitda), hint: 'Стоимость бизнеса к операционной прибыли до амортизации и налогов.' },
                { label: 'EPS', value: f.eps === null ? '—' : formatMoney(f.eps, cur), hint: 'Прибыль на одну акцию.' }
            ]
        },
        {
            title: 'Рентабельность',
            metrics: [
                { label: 'ROE', value: pct(f.roe), hint: 'Рентабельность собственного капитала — сколько прибыли на вложенный акционерами рубль.' },
                { label: 'ROA', value: pct(f.roa), hint: 'Рентабельность активов.' },
                { label: 'ROIC', value: pct(f.roic), hint: 'Рентабельность инвестированного капитала.' },
                { label: 'Чистая маржа', value: pct(f.netMargin), hint: 'Доля чистой прибыли в выручке.' }
            ]
        },
        {
            title: 'Долг и устойчивость',
            metrics: [
                { label: 'Чистый долг / EBITDA', value: ratio(f.netDebtToEbitda), hint: 'За сколько лет операционной прибыли компания погасила бы чистый долг. Ниже — надёжнее.' },
                { label: 'Долг / EBITDA', value: ratio(f.totalDebtToEbitda) },
                { label: 'Коэф. текущей ликвидности', value: ratio(f.currentRatio), hint: 'Оборотные активы / краткосрочные обязательства. >1 — хватает на короткие долги.' }
            ]
        },
        {
            title: 'Рост',
            metrics: [
                { label: 'Рост выручки, год', value: pct(f.revenueGrowth1y, true) },
                { label: 'Рост выручки, 5 лет', value: pct(f.revenueGrowth5y, true), hint: 'Среднегодовой рост выручки за 5 лет.' }
            ]
        },
        {
            title: 'Дивиденды и выкуп',
            metrics: [
                { label: 'Див. доходность', value: pct(f.dividendYield), hint: 'Доходность по дивидендам за 12 месяцев (по данным Т-Банка).' },
                { label: 'Payout', value: pct(f.dividendPayoutRatio), hint: 'Доля прибыли, направляемая на дивиденды.' },
                { label: 'Buyback', value: pct(f.buyBack), hint: 'Обратный выкуп акций за период.' }
            ]
        },
        {
            title: 'Прочее',
            metrics: [
                { label: 'Beta', value: ratio(f.beta), hint: 'Волатильность относительно рынка. <1 — спокойнее рынка, >1 — резче.' },
                { label: 'Free-float', value: pct(f.freeFloat), hint: 'Доля акций в свободном обращении.' },
                { label: 'Сотрудников', value: f.employees === null ? '—' : new Intl.NumberFormat('ru-RU').format(f.employees) },
                { label: 'Ближайшая отсечка', value: ruDate(f.exDividendDate), hint: 'Дата закрытия реестра под ближайшую выплату.' }
            ]
        }
    ]
        // Прячем группы, где все значения — прочерк (например, у банков нет EBITDA-блока).
        .map((g) => ({ ...g, metrics: g.metrics.filter((m) => m.value !== '—') }))
        .filter((g) => g.metrics.length > 0);

    if (!groups.length) return null;

    return (
        <section className={style.wrapper}>
            <div className={style.head}>
                <h2 className={style.title}>Фундаментальные показатели</h2>
                <span className={style.sub}>по данным Т-Банка</span>
            </div>

            {groups.map((group) => (
                <div key={group.title} className={style.group}>
                    <h3 className={style.groupTitle}>{group.title}</h3>
                    <div className={style.grid}>
                        {group.metrics.map((metric) => (
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
                </div>
            ))}
        </section>
    );
};
export default Fundamentals;
