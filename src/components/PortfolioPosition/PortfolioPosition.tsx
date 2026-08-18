'use client';
import React from 'react';
import { Table, TableProps, Tag, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { IPosition, IPaymentItem } from '@models/tinkoffData';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useInstrumentPayments } from '@/hooks/useInstrumentPayments';
import { useInstrumentRealized } from '@/hooks/useInstrumentRealized';
import { formatAmount, intToRub } from '@/utils/formatCurrency';
import { formatDateTime } from '@/utils/dateUtils';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import style from './style.module.scss';

interface PortfolioPositionProps {
    /** Тикер / secid бумаги (главный ключ поиска позиции). */
    ticker?: string | null;
    /** ISIN (запасной ключ поиска позиции). */
    isin?: string | null;
    /** Привилегированная ли акция — для связки обычка↔префы (у облигаций не задаётся). */
    isPreferred?: boolean;
}

/**
 * Тикер «сиблинга» (парной обычки/префа того же эмитента) по конвенции MOEX:
 * у префа хвостовая «P» (SBERP→SBER), у обычки — приписываем «P» (SBER→SBERP).
 * «P» срезаем ТОЛЬКО у префов — иначе обычка вроде GAZP (не преф) ошибочно
 * свелась бы к чужому тикеру. Существование результата проверяет вызывающий.
 */
const siblingTicker = (ticker: string, isPreferred?: boolean): string | null => {
    const t = norm(ticker);
    if (!t) return null;
    if (isPreferred) return t.endsWith('P') && t.length > 1 ? t.slice(0, -1) : null;
    if (isPreferred === false) return `${t}P`;
    return null; // тип бумаги неизвестен (облигация) — без связки
};

const GAIN = '#1baf7a';
const LOSS = '#e24b4a';

const norm = (v?: string | null) => (v ?? '').trim().toUpperCase();

/** Находит позицию текущего портфеля по тикеру или ISIN. */
const findPosition = (positions: IPosition[], ticker?: string | null, isin?: string | null) => {
    const t = norm(ticker);
    const i = norm(isin);
    return positions.find(
        (p) => (t && norm(p.ticker) === t) || (i && norm(p.isin) === i)
    );
};

const signedRub = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${intToRub(Math.abs(v))}`;
const signedPct = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}%`;
const toneColor = (v: number) => (v > 0 ? GAIN : v < 0 ? LOSS : 'inherit');

const PAYMENT_LABEL: Record<string, string> = {
    dividend: 'Дивиденд',
    coupon: 'Купон'
};

interface StatRowProps {
    label: string;
    value: string;
    sub?: string;
    color?: string;
    hint?: string;
    muted: string;
    border: string;
}

const StatRow: React.FC<StatRowProps> = ({ label, value, sub, color, hint, muted, border }) => (
    <div className={style.row} style={{ borderColor: border }}>
        <span className={style.rowLabel} style={{ color: muted }}>
            {label}
            {hint ? (
                <Tooltip title={hint}>
                    <InfoCircleOutlined className={style.hint} />
                </Tooltip>
            ) : null}
        </span>
        <span className={style.rowValue}>
            <span style={{ color }}>{value}</span>
            {sub ? (
                <span className={style.rowSub} style={{ color: color ?? muted }}>
                    {sub}
                </span>
            ) : null}
        </span>
    </div>
);

/**
 * Блок «В портфеле» на странице бумаги: полная доходность (курс + начисления −
 * налоги/комиссии) и история полученных дивидендов/купонов. Рендерится, только
 * если бумага есть в подключённом портфеле Т-Банка; иначе — ничего.
 */
const PortfolioPosition: React.FC<PortfolioPositionProps> = ({ ticker, isin, isPreferred }) => {
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const { aggregate } = usePortfolio();

    // «Семья» тикеров: сама бумага + парная обычка/преф. Существование сиблинга
    // не проверяем — суффикс «P» на MOEX закреплён за префами того же эмитента
    // (а срезаем «P» только у самих префов), поэтому промахнуться в чужую бумагу
    // нельзя; если по сиблингу операций нет — набор просто ни с чем не сматчится.
    const sibling = ticker ? siblingTicker(ticker, isPreferred) : null;
    const relatedTickers = React.useMemo(
        () => [ticker, sibling].filter((t): t is string => Boolean(t)),
        [ticker, sibling]
    );

    const position = aggregate ? findPosition(aggregate.positions, ticker, isin) : undefined;
    const payments = useInstrumentPayments(position?.instrumentUid, position?.figi, relatedTickers);
    const realized = useInstrumentRealized(position?.instrumentUid, position?.figi, relatedTickers);

    // Бумаги нет в портфеле (или портфель не подключён) — секцию не показываем.
    if (!position) return null;

    const invested = (position.averagePositionPrice ?? 0) * (position.quantity ?? 0);
    const priceGain = position.expectedYieldFifo ?? 0;
    const priceGainPct = position.expectedYieldPercent ?? 0;
    const dayAbs = position.dailyYield ?? 0;
    const prevValue = (position.priceInPorfolio ?? 0) - dayAbs;
    const dayPct = prevValue > 0 ? (dayAbs / prevValue) * 100 : 0;

    // Полная прибыль = курсовая (по текущей позиции) + реализованная по уже
    // проданным лотам + начисления − налоги − комиссии.
    const total = priceGain + realized.realized + payments.net;
    const totalPct = invested > 0 ? (total / invested) * 100 : 0;

    const payoutRows = payments.items.filter(
        (item) => item.category === 'dividend' || item.category === 'coupon'
    );

    // Были ли реально операции по сиблингу — по этому признаку показываем колонку
    // «Бумага» и подпись про пару (иначе таблица была бы из одного тикера).
    const sib = norm(sibling);
    const familyView =
        Boolean(sib) &&
        (realized.items.some((i) => norm(i.ticker) === sib) ||
            payments.items.some((i) => norm(i.ticker) === sib));

    const columns: TableProps<IPaymentItem>['columns'] = [
        {
            title: 'Дата',
            dataIndex: 'date',
            key: 'date',
            render: (_, row) => formatDateTime(row.date)
        },
        ...(familyView
            ? [{
                  title: 'Бумага',
                  key: 'ticker',
                  render: (_: unknown, row: IPaymentItem) => row.ticker ?? row.name ?? '—'
              } as const]
            : []),
        {
            title: 'Тип',
            key: 'type',
            render: (_, row) => (
                <Tag bordered={false} color={row.category === 'coupon' ? 'blue' : 'green'}>
                    {PAYMENT_LABEL[row.category] ?? row.category}
                </Tag>
            )
        },
        {
            title: 'Сумма',
            key: 'payment',
            align: 'right',
            render: (_, row) => (
                <span style={{ color: GAIN }}>{signedRub(row.payment)}</span>
            ),
            sorter: (a, b) => a.payment - b.payment
        }
    ];

    return (
        <section className={style.wrapper}>
            <div className={style.head}>
                <h2 className={style.title}>В портфеле</h2>
                <Tag bordered={false} className={style.qtyTag}>
                    {position.quantity} шт ·{' '}
                    {formatAmount(position.priceInPorfolio, position.currency)}
                </Tag>
            </div>

            <div
                className={style.card}
                style={{ background: palette.containerBg, borderColor: palette.border }}
            >
                <StatRow
                    label='Прибыль'
                    value={signedRub(total)}
                    sub={signedPct(totalPct)}
                    color={toneColor(total)}
                    muted={palette.textMuted}
                    border={palette.border}
                    hint='Полный результат по бумаге: курсовая разница текущей позиции + прибыль от уже проданных лотов + полученные дивиденды/купоны за вычетом налога и комиссий.'
                />
                <StatRow
                    label='За день'
                    value={signedRub(dayAbs)}
                    sub={signedPct(dayPct)}
                    color={toneColor(dayAbs)}
                    muted={palette.textMuted}
                    border={palette.border}
                />
                <StatRow
                    label='От роста цены'
                    value={signedRub(priceGain)}
                    sub={signedPct(priceGainPct)}
                    color={toneColor(priceGain)}
                    muted={palette.textMuted}
                    border={palette.border}
                    hint='Нереализованная курсовая разница по текущей позиции (FIFO): текущая цена против средней цены покупки.'
                />
                {realized.hasSales ? (
                    <StatRow
                        label='Прибыль от продаж'
                        value={signedRub(realized.realized)}
                        color={toneColor(realized.realized)}
                        muted={palette.textMuted}
                        border={palette.border}
                        hint='Реализованный результат по уже проданным лотам этой бумаги (посчитан Т-Банком по FIFO), за всё время.'
                    />
                ) : null}
                <StatRow
                    label='Получено начислений'
                    value={signedRub(payments.income)}
                    color={payments.income > 0 ? GAIN : 'inherit'}
                    muted={palette.textMuted}
                    border={palette.border}
                    hint='Сумма всех дивидендов и купонов по бумаге до вычета налога, за всё время владения.'
                />
                {payments.taxes > 0 ? (
                    <StatRow
                        label='Налоги'
                        value={signedRub(-payments.taxes)}
                        color={LOSS}
                        muted={palette.textMuted}
                        border={palette.border}
                    />
                ) : null}
                {payments.fees > 0 ? (
                    <StatRow
                        label='Уплачено комиссий'
                        value={signedRub(-payments.fees)}
                        color={LOSS}
                        muted={palette.textMuted}
                        border={palette.border}
                        hint='Комиссии по сделкам с этой бумагой.'
                    />
                ) : null}
                <StatRow
                    label='Средняя цена'
                    value={formatAmount(position.averagePositionPrice, position.currency)}
                    muted={palette.textMuted}
                    border={palette.border}
                />
            </div>

            {familyView ? (
                <p className={style.note}>
                    Учтены операции по паре {norm(ticker)} и {sib} (обычка и префы одного
                    эмитента); текущая позиция и «От роста цены» — только по {norm(ticker)}.
                </p>
            ) : null}

            {payments.hasNonRub || realized.hasNonRub ? (
                <p className={style.note}>
                    Были выплаты или продажи в валюте — в рублёвые суммы выше они не вошли.
                </p>
            ) : null}

            {payoutRows.length ? (
                <Table<IPaymentItem>
                    className={style.table}
                    columns={columns}
                    dataSource={payoutRows}
                    rowKey='id'
                    size='middle'
                    scroll={{ x: 'max-content' }}
                    pagination={{ pageSize: 8, showSizeChanger: false, hideOnSinglePage: true }}
                />
            ) : payments.status === 'ready' ? (
                <p className={style.note}>Начислений по бумаге пока не было.</p>
            ) : null}
        </section>
    );
};
export default PortfolioPosition;
