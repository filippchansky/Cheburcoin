'use client';
import React from 'react';
import { Alert, Button, Empty, Grid, Segmented, Skeleton, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { IPaymentItem, PaymentCategory } from '@models/tinkoffData';
import { usePayments } from '@/hooks/usePayments';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { intToRub } from '@/utils/formatCurrency';
import { formatDayShort, formatDayWeekday } from '@/utils/dateUtils';
import ShareLogo from '@/components/ShareLogo/ShareLogo';
import { MonthGroupedList, NEGATIVE_COLOR, POSITIVE_COLOR } from './PaymentsList';
import cardStyle from './style.module.scss';

const isRubCurrency = (currency: string | null) =>
    !currency || ['rub', 'sur', 'RUB', 'SUR'].includes(currency);

const formatPaymentAmount = (payment: number, currency: string | null) =>
    currency && !['rub', 'sur', 'RUB', 'SUR'].includes(currency)
        ? `${payment.toFixed(2)} ${currency.toUpperCase()}`
        : intToRub(payment);

const PERIOD_OPTIONS = [
    { label: '6 мес', value: 6 },
    { label: '12 мес', value: 12 },
    { label: '24 мес', value: 24 }
];

/** Подпись категории и цвет точки статуса в строке списка. */
const CATEGORY_META: Record<PaymentCategory, { label: string; dot: string }> = {
    coupon: { label: 'Купон', dot: POSITIVE_COLOR },
    dividend: { label: 'Дивиденд', dot: '#4098fc' },
    repayment: { label: 'Погашение', dot: '#9254de' },
    tax: { label: 'Налог', dot: NEGATIVE_COLOR },
    fee: { label: 'Комиссия', dot: '#fa8c16' },
    other: { label: 'Прочее', dot: '#8c8c8c' }
};

interface HistoryRowProps {
    item: IPaymentItem;
    isMobile: boolean;
}

/**
 * Строка прошедшей выплаты: на десктопе — колонки (инструмент / дата и тип /
 * сумма), на мобильных — компактная карточка. Логотип берём по инициалам
 * тикера: у операций нет ISIN, по которому грузятся картинки бумаг.
 */
const HistoryRow: React.FC<HistoryRowProps> = ({ item, isMobile }) => {
    const meta = CATEGORY_META[item.category];
    const positive = item.payment >= 0;
    const amount = (
        <span
            className={cardStyle.payAmountValue}
            style={{ color: positive ? POSITIVE_COLOR : NEGATIVE_COLOR }}
        >
            {positive ? '+' : ''}
            {formatPaymentAmount(item.payment, item.currency)}
        </span>
    );
    const status = (
        <span className={cardStyle.payStatus}>
            <i className={cardStyle.statusDot} style={{ background: meta.dot }} />
            {meta.label}
        </span>
    );

    if (isMobile) {
        return (
            <div className={cardStyle.payRow}>
                <div className={cardStyle.payHead}>
                    <span className={cardStyle.payDate}>{formatDayWeekday(item.date)}</span>
                    {status}
                </div>
                <div className={cardStyle.payBody}>
                    <div className={cardStyle.payInfo}>
                        <span className={cardStyle.payName}>{item.name ?? meta.label}</span>
                    </div>
                    <div className={cardStyle.payAmount}>{amount}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={cardStyle.historyRow}>
            <div className={cardStyle.payInstrument}>
                {item.ticker ? <ShareLogo icon='' ticker={item.ticker} size={36} /> : null}
                <div className={cardStyle.payInfo}>
                    <span className={cardStyle.payName}>{item.name ?? meta.label}</span>
                    <span className={cardStyle.paySub}>{item.ticker ?? ''}</span>
                </div>
            </div>
            <div className={cardStyle.payCell}>
                <span className={cardStyle.payCellValue}>{formatDayShort(item.date)}</span>
                {status}
            </div>
            <div className={cardStyle.payAmount}>{amount}</div>
        </div>
    );
};

interface MiniStatProps {
    label: string;
    value: string;
    color?: string;
    bg: string;
    border: string;
    muted: string;
}

const MiniStat: React.FC<MiniStatProps> = ({ label, value, color, bg, border, muted }) => (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ fontSize: 13, color: muted, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color: color ?? 'inherit' }}>{value}</div>
    </div>
);

const PaymentsHistory: React.FC = () => {
    const [months, setMonths] = React.useState<number>(12);
    const { items, byMonth, totalNet, totalGross, totalTax, hasNonRub, status, isFetching, refetchAll } =
        usePayments(months);
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const screens = Grid.useBreakpoint();
    const isMobile = screens.md === false;
    const [categories, setCategories] = React.useState<PaymentCategory[]>([]);

    /** Типы выплат, реально встречающиеся в периоде — только их показываем в фильтре. */
    const presentCategories = React.useMemo(
        () => (Object.keys(CATEGORY_META) as PaymentCategory[]).filter((c) => items.some((i) => i.category === c)),
        [items]
    );

    const periodSwitch = (
        <Segmented<number>
            options={PERIOD_OPTIONS}
            value={months}
            onChange={setMonths}
            disabled={status === 'loading'}
        />
    );

    if (status === 'empty') {
        return <Empty description='Подключите счёт Т-Банка, чтобы увидеть историю выплат' />;
    }

    if (status === 'error') {
        return (
            <Alert
                type='error'
                showIcon
                message='Не удалось загрузить историю выплат'
                description='Проверьте подключение к сети или обновите.'
                action={
                    <Button size='small' onClick={refetchAll}>
                        Повторить
                    </Button>
                }
            />
        );
    }

    /** Мобильный список фильтруется по выбранным типам (пусто = показываем все). */
    const filteredItems = categories.length ? items.filter((i) => categories.includes(i.category)) : items;

    const chartOption = {
        grid: {
            top: 16,
            right: isMobile ? 6 : 12,
            bottom: 24,
            left: isMobile ? 4 : 8,
            containLabel: true
        },
        tooltip: {
            trigger: 'axis',
            formatter: (params: { name: string; value: number }[]) =>
                `${params[0].name}<br/>${intToRub(params[0].value)}`
        },
        xAxis: {
            type: 'category',
            data: byMonth.map((bucket) => bucket.label),
            axisLabel: {
                color: palette.textMuted,
                fontSize: 11,
                // На мобилках оставляем только месяц без года: «авг. 2026 г.» → «авг.»
                formatter: isMobile ? (value: string) => value.split(' ')[0] : undefined
            },
            axisLine: { lineStyle: { color: palette.border } }
        },
        yAxis: {
            type: 'value',
            // На мобилках убираем колонку сумм слева, чтобы график занял всю ширину.
            axisLabel: {
                show: !isMobile,
                color: palette.textMuted,
                fontSize: 11,
                formatter: (value: number) =>
                    new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
            },
            splitLine: { lineStyle: { color: palette.border, opacity: 0.4 } }
        },
        series: [
            {
                type: 'bar',
                data: byMonth.map((bucket) => ({
                    value: bucket.amount,
                    itemStyle: { color: bucket.amount >= 0 ? '#1baf7a' : '#e24b4a', borderRadius: [4, 4, 0, 0] }
                })),
                barMaxWidth: 36
            }
        ]
    };

    return (
        <div>
            <div className='flex items-center justify-between gap-3 mb-4 flex-wrap'>
                {periodSwitch}
                <Button icon={<ReloadOutlined spin={isFetching} />} onClick={refetchAll}>
                    Обновить
                </Button>
            </div>

            {status === 'loading' ? (
                <div>
                    <Skeleton.Node active style={{ width: '100%', height: 84 }}>
                        <span />
                    </Skeleton.Node>
                    <Skeleton active paragraph={{ rows: 6 }} className='mt-5' />
                </div>
            ) : (
                <>
                    <div
                        className='grid gap-3 mb-5'
                        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}
                    >
                        <MiniStat
                            label='Получено чистыми'
                            value={intToRub(totalNet)}
                            color='#1baf7a'
                            bg={palette.containerBg}
                            border={palette.border}
                            muted={palette.textMuted}
                        />
                        <MiniStat
                            label='Начислено (до налога)'
                            value={intToRub(totalGross)}
                            bg={palette.containerBg}
                            border={palette.border}
                            muted={palette.textMuted}
                        />
                        <MiniStat
                            label='Удержано налога'
                            value={intToRub(totalTax)}
                            color={totalTax > 0 ? '#e24b4a' : undefined}
                            bg={palette.containerBg}
                            border={palette.border}
                            muted={palette.textMuted}
                        />
                    </div>

                    {hasNonRub ? (
                        <Alert
                            type='info'
                            showIcon
                            className='mb-4'
                            message='Есть выплаты в иностранной валюте — они не вошли в рублёвый итог и график.'
                        />
                    ) : null}

                    {items.length ? (
                        <>
                            <div className='mb-5'>
                                <ReactECharts option={chartOption} style={{ height: 220 }} notMerge lazyUpdate />
                            </div>

                            {presentCategories.length > 1 ? (
                                <div className='flex flex-wrap gap-2 mb-4'>
                                    {presentCategories.map((c) => (
                                        <Tag.CheckableTag
                                            key={c}
                                            checked={categories.includes(c)}
                                            onChange={(checked) =>
                                                setCategories((prev) =>
                                                    checked ? [...prev, c] : prev.filter((x) => x !== c)
                                                )
                                            }
                                        >
                                            {CATEGORY_META[c].label}
                                        </Tag.CheckableTag>
                                    ))}
                                </div>
                            ) : null}

                            {filteredItems.length ? (
                                <MonthGroupedList<IPaymentItem>
                                    items={[...filteredItems].sort((a, b) => b.date.localeCompare(a.date))}
                                    monthKey={(item) => item.date.slice(0, 7)}
                                    // Валютные выплаты в рублёвый итог месяца не берём — курса тут нет.
                                    rubAmount={(item) => (isRubCurrency(item.currency) ? item.payment : 0)}
                                    rowKey={(item) => item.id}
                                    resetKey={`${months}-${categories.join(',')}`}
                                    renderRow={(item) => <HistoryRow item={item} isMobile={isMobile} />}
                                />
                            ) : (
                                <Empty description='Нет выплат выбранного типа' />
                            )}
                        </>
                    ) : (
                        <Empty description='За выбранный период выплат не было' />
                    )}
                </>
            )}
        </div>
    );
};
export default PaymentsHistory;
