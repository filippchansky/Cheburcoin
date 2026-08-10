'use client';
import React from 'react';
import { Alert, Button, Empty, Grid, Segmented, Skeleton, Switch, Table, TableProps, Tag, Tooltip } from 'antd';
import { InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { IPosition } from '@models/tinkoffData';
import { CalendarEvent, CalendarKind, usePaymentsCalendar } from '@/hooks/usePaymentsCalendar';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { intToRub } from '@/utils/formatCurrency';
import { formatDate, formatDayShort, formatDayWeekday, formatMonthTitle } from '@/utils/dateUtils';
import TableName from '@/components/TableName/TableName';
import ShareLogo from '@/components/ShareLogo/ShareLogo';
import cardStyle from './style.module.scss';

/** Сколько выплат показываем на мобильных до нажатия «Показать ещё». */
const MOBILE_PAGE = 20;

const isRubCurrency = (currency: string | null) =>
    !currency || ['rub', 'sur', 'RUB', 'SUR'].includes(currency);

const formatEventAmount = (amount: number, currency: string | null) =>
    isRubCurrency(currency) ? intToRub(amount) : `${amount.toFixed(2)} ${currency!.toUpperCase()}`;

/** Группирует отсортированные события по месяцу с рублёвым итогом группы. */
const groupByMonth = (events: CalendarEvent[]) => {
    const groups: { key: string; total: number; items: CalendarEvent[] }[] = [];
    const index = new Map<string, number>();
    events.forEach((event) => {
        const key = event.date.slice(0, 7);
        let gi = index.get(key);
        if (gi === undefined) {
            gi = groups.length;
            index.set(key, gi);
            groups.push({ key, total: 0, items: [] });
        }
        groups[gi].items.push(event);
        if (isRubCurrency(event.currency)) groups[gi].total += event.amount;
    });
    return groups;
};

interface PaymentsCalendarProps {
    /** Облигационные позиции (агрегат по всем счетам) — источник купонов. */
    bondPositions: IPosition[];
    /** Акции (агрегат по всем счетам) — источник дивидендов (объявленных + прогноз). */
    sharePositions: IPosition[];
}

const COUPON_COLOR = '#1baf7a';
const DIVIDEND_COLOR = '#4098fc';

const KIND_META: Record<CalendarKind, { label: string; color: string }> = {
    coupon: { label: 'Купон', color: 'green' },
    dividend: { label: 'Дивиденд', color: 'blue' }
};

interface TotalTileProps {
    label: string;
    value: string;
    color: string;
    bg: string;
    border: string;
    muted: string;
    sub?: string;
}

const TotalTile: React.FC<TotalTileProps> = ({ label, value, color, bg, border, muted, sub }) => (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ fontSize: 13, color: muted, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color }}>{value}</div>
        {sub ? <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>{sub}</div> : null}
    </div>
);

const PaymentsCalendar: React.FC<PaymentsCalendarProps> = ({ bondPositions, sharePositions }) => {
    const {
        events,
        byMonth,
        couponTotal,
        dividendTotal,
        dividendProjectedTotal,
        hasNonRub,
        status,
        isFetching,
        refetch
    } = usePaymentsCalendar(bondPositions, sharePositions);
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const screens = Grid.useBreakpoint();
    const isMobile = screens.md === false;
    const [showForecast, setShowForecast] = React.useState(true);
    const [kindFilter, setKindFilter] = React.useState<'all' | CalendarKind>('all');
    const [visible, setVisible] = React.useState(MOBILE_PAGE);

    if (status === 'empty') {
        return <Empty description='В портфеле нет облигаций и акций — предстоящих выплат не ожидается' />;
    }

    if (status === 'loading') {
        return (
            <div>
                <Skeleton.Node active style={{ width: '100%', height: 84 }}>
                    <span />
                </Skeleton.Node>
                <Skeleton active paragraph={{ rows: 6 }} className='mt-5' />
            </div>
        );
    }

    if (status === 'error') {
        return (
            <Alert
                type='error'
                showIcon
                message='Не удалось загрузить календарь выплат'
                description='Проверьте подключение к сети или обновите.'
                action={
                    <Button size='small' onClick={refetch}>
                        Повторить
                    </Button>
                }
            />
        );
    }

    const hasForecast = dividendProjectedTotal > 0 || events.some((e) => e.projected);
    const showCoupons = kindFilter !== 'dividend';
    const showDividends = kindFilter !== 'coupon';
    const visibleEvents = events.filter(
        (e) => (showForecast || !e.projected) && (kindFilter === 'all' || e.kind === kindFilter)
    );
    const dividendTileTotal = showForecast ? round(dividendTotal + dividendProjectedTotal) : dividendTotal;

    const forecastSeriesData = byMonth.map((bucket) => (showForecast ? bucket.dividendProjected : 0));

    const couponSeries = {
        name: 'Купоны',
        type: 'bar',
        stack: 'total',
        data: byMonth.map((bucket) => bucket.coupon),
        itemStyle: { color: COUPON_COLOR },
        barMaxWidth: 36
    };
    const dividendSeries = {
        name: 'Дивиденды',
        type: 'bar',
        stack: 'total',
        data: byMonth.map((bucket) => bucket.dividend),
        itemStyle: { color: DIVIDEND_COLOR },
        barMaxWidth: 36
    };
    const forecastSeries = {
        name: 'Дивиденды · прогноз',
        type: 'bar',
        stack: 'total',
        data: forecastSeriesData,
        itemStyle: { color: DIVIDEND_COLOR },
        barMaxWidth: 36
    };

    const chartSeries = [
        ...(showCoupons ? [couponSeries] : []),
        ...(showDividends ? [dividendSeries, forecastSeries] : [])
    ];
    const legendData = [
        ...(showCoupons ? ['Купоны'] : []),
        ...(showDividends ? ['Дивиденды'] : []),
        ...(showDividends && showForecast ? ['Дивиденды · прогноз'] : [])
    ];

    const chartOption = {
        grid: {
            top: isMobile ? 40 : 16,
            right: isMobile ? 6 : 12,
            bottom: 24,
            left: isMobile ? 4 : 8,
            containLabel: true
        },
        legend: {
            data: legendData,
            top: 0,
            left: 'center',
            textStyle: { color: palette.textMuted, fontSize: isMobile ? 10 : 12 },
            itemWidth: 12,
            itemHeight: 12,
            itemGap: isMobile ? 8 : 14
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params: { name: string; seriesName: string; value: number }[]) => {
                const total = params.reduce((sum, p) => sum + (p.value || 0), 0);
                const rows = params
                    .filter((p) => p.value)
                    .map((p) => `${p.seriesName}: ${intToRub(p.value)}`)
                    .join('<br/>');
                return `${params[0].name}<br/>${rows || '—'}<br/><b>Итого: ${intToRub(total)}</b>`;
            }
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
        series: chartSeries
    };

    const columns: TableProps<CalendarEvent>['columns'] = [
        {
            title: 'Дата выплаты',
            key: 'date',
            render: (_, { date }) => formatDate(date?.slice(0, 10)),
            sorter: (a, b) => a.date.localeCompare(b.date),
            defaultSortOrder: 'ascend'
        },
        {
            title: 'Тип',
            key: 'kind',
            render: (_, { kind, projected }) => (
                <span className='inline-flex items-center gap-1'>
                    <Tag color={KIND_META[kind].color} style={{ marginInlineEnd: 0 }}>
                        {KIND_META[kind].label}
                    </Tag>
                    {projected ? (
                        <Tooltip title='Оценка по прошлым выплатам эмитента — не объявлена официально'>
                            <span
                                style={{
                                    fontSize: 11,
                                    lineHeight: '18px',
                                    color: palette.textMuted,
                                    border: `1px dashed ${palette.border}`,
                                    borderRadius: 6,
                                    padding: '0 6px'
                                }}
                            >
                                прогноз
                            </span>
                        </Tooltip>
                    ) : null}
                </span>
            ),
            filters: (Object.keys(KIND_META) as CalendarKind[]).map((key) => ({
                text: KIND_META[key].label,
                value: key
            })),
            onFilter: (value, record) => record.kind === value
        },
        {
            title: 'Инструмент',
            key: 'name',
            render: (_, { ticker, name, isin }) => (
                <TableName icon={isin ?? ''} ticker={ticker ?? ''} title={name ?? ''} />
            )
        },
        {
            title: (
                <span>
                    Отсечка{' '}
                    <Tooltip title='Держатель бумаги на эту дату получает выплату; после неё покупка права на неё уже не даёт'>
                        <InfoCircleOutlined style={{ color: palette.textMuted }} />
                    </Tooltip>
                </span>
            ),
            key: 'fixDate',
            render: (_, { fixDate }) => (fixDate ? formatDate(fixDate.slice(0, 10)) : '—')
        },
        {
            title: 'Кол-во',
            key: 'quantity',
            align: 'right',
            render: (_, { quantity }) => quantity
        },
        {
            title: 'Сумма',
            key: 'amount',
            align: 'right',
            render: (_, { amount, currency }) => formatEventAmount(amount, currency),
            sorter: (a, b) => a.amount - b.amount
        }
    ];

    return (
        <div>
            <div className='flex items-center justify-between gap-3 mb-4 flex-wrap'>
                <div
                    className='grid gap-3'
                    style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', flex: 1, minWidth: 260 }}
                >
                    <TotalTile
                        label='Купоны за 12 мес · до налога'
                        value={intToRub(couponTotal)}
                        color={COUPON_COLOR}
                        bg={palette.containerBg}
                        border={palette.border}
                        muted={palette.textMuted}
                    />
                    <TotalTile
                        label='Дивиденды за 12 мес'
                        value={intToRub(dividendTileTotal)}
                        color={DIVIDEND_COLOR}
                        bg={palette.containerBg}
                        border={palette.border}
                        muted={palette.textMuted}
                        sub={
                            showForecast && dividendProjectedTotal > 0
                                ? `в т.ч. прогноз: ${intToRub(dividendProjectedTotal)}`
                                : undefined
                        }
                    />
                </div>
                <Button icon={<ReloadOutlined spin={isFetching} />} onClick={refetch}>
                    Обновить
                </Button>
            </div>

            <div className='mb-4'>
                <Segmented<'all' | CalendarKind>
                    block={isMobile}
                    options={[
                        { label: 'Все', value: 'all' },
                        { label: 'Купоны', value: 'coupon' },
                        { label: 'Дивиденды', value: 'dividend' }
                    ]}
                    value={kindFilter}
                    onChange={setKindFilter}
                />
            </div>

            {hasForecast && kindFilter !== 'coupon' ? (
                <div className='flex items-center gap-2 mb-4'>
                    <Switch checked={showForecast} onChange={setShowForecast} size='small' />
                    <span style={{ color: palette.textMuted, fontSize: 13 }}>
                        Показывать прогноз дивидендов по прошлым выплатам
                    </span>
                </div>
            ) : null}

            {hasNonRub ? (
                <Alert
                    type='info'
                    showIcon
                    className='mb-4'
                    message='Есть выплаты в иностранной валюте — они не вошли в рублёвый итог и график.'
                />
            ) : null}

            {visibleEvents.length ? (
                <>
                    <div className='mb-5'>
                        <ReactECharts option={chartOption} style={{ height: 240 }} notMerge lazyUpdate />
                    </div>
                    {isMobile ? (
                        <div
                            className={cardStyle.payList}
                            style={{
                                ['--rowBorder' as string]: palette.border,
                                ['--rowBg' as string]: palette.layoutBg
                            }}
                        >
                            {groupByMonth(
                                [...visibleEvents].sort((a, b) => a.date.localeCompare(b.date)).slice(0, visible)
                            ).map((group) => (
                                <React.Fragment key={group.key}>
                                    <div className={cardStyle.monthHead}>
                                        <span className={cardStyle.monthName}>{formatMonthTitle(group.key)}</span>
                                        <span
                                            className={cardStyle.monthTotal}
                                            style={{ color: '#1baf7a', background: 'rgba(27,175,122,0.12)' }}
                                        >
                                            +{intToRub(group.total)}
                                        </span>
                                    </div>
                                    {group.items.map((event) => (
                                        <div
                                            key={event.id}
                                            className={cardStyle.payRow}
                                        >
                                            <div className={cardStyle.payHead}>
                                                <span className={cardStyle.payDate}>
                                                    📅 {formatDayWeekday(event.date)}
                                                </span>
                                                <span className='inline-flex items-center gap-1'>
                                                    <Tag
                                                        color={KIND_META[event.kind].color}
                                                        style={{ marginInlineEnd: 0 }}
                                                    >
                                                        {KIND_META[event.kind].label}
                                                    </Tag>
                                                    {event.projected ? (
                                                        <span
                                                            style={{
                                                                fontSize: 11,
                                                                lineHeight: '18px',
                                                                color: palette.textMuted,
                                                                border: `1px dashed ${palette.border}`,
                                                                borderRadius: 6,
                                                                padding: '0 6px'
                                                            }}
                                                        >
                                                            прогноз
                                                        </span>
                                                    ) : null}
                                                </span>
                                            </div>
                                            <div className={cardStyle.payBody}>
                                                <ShareLogo
                                                    icon={event.isin ?? ''}
                                                    ticker={event.ticker ?? ''}
                                                    size={40}
                                                />
                                                <div className={cardStyle.payInfo}>
                                                    <span className={cardStyle.payName}>
                                                        {event.name ?? event.ticker ?? '—'}
                                                    </span>
                                                    <span className={cardStyle.paySub}>
                                                        {event.fixDate
                                                            ? `✂ ${formatDayShort(event.fixDate)} · `
                                                            : ''}
                                                        {event.quantity} шт
                                                    </span>
                                                </div>
                                                <div className={cardStyle.payAmount}>
                                                    <span
                                                        className={cardStyle.payAmountValue}
                                                        style={{ color: '#1baf7a' }}
                                                    >
                                                        +{formatEventAmount(event.amount, event.currency)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                            {visible < visibleEvents.length ? (
                                <Button
                                    className={cardStyle.showMore}
                                    block
                                    onClick={() => setVisible((v) => v + MOBILE_PAGE)}
                                >
                                    Показать ещё
                                </Button>
                            ) : null}
                        </div>
                    ) : (
                        <Table<CalendarEvent>
                            columns={columns}
                            dataSource={visibleEvents}
                            rowKey='id'
                            scroll={{ x: 'max-content' }}
                            pagination={{ pageSize: 15, showSizeChanger: false, hideOnSinglePage: true }}
                        />
                    )}
                </>
            ) : (
                <Empty description='Нет предстоящих выплат в ближайшие 12 месяцев' />
            )}
        </div>
    );
};

const round = (n: number) => Number(n.toFixed(2));

export default PaymentsCalendar;
