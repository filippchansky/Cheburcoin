'use client';
import React from 'react';
import { Alert, Button, Checkbox, Empty, Grid, Segmented, Skeleton, Switch, Tooltip } from 'antd';
import { InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { IPosition } from '@models/tinkoffData';
import { AccountPortfolio, mergePositions } from '@/hooks/usePortfolio';
import { CalendarEvent, CalendarKind, usePaymentsCalendar } from '@/hooks/usePaymentsCalendar';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { intToRub } from '@/utils/formatCurrency';
import PaymentsList from './PaymentsList';

interface CalendarBodyProps {
    /** Облигационные позиции выбранных счетов — источник купонов. */
    bondPositions: IPosition[];
    /** Акции/фонды выбранных счетов — источник дивидендов (объявленных + прогноз). */
    sharePositions: IPosition[];
    /** Полная стоимость выбранных счетов (₽, вкл. кэш/валюту/крипту) — база «ко всему счёту». */
    accountsMoney: number;
}

/** Процент годовых в ru-формате: 19.28 → «19,28%». */
const formatPct = (n: number) =>
    `${n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

/** Склонение «бумаге/бумагам» для дательного падежа («по N …»). */
const plsBumag = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'бумаге' : 'бумагам');

const COUPON_COLOR = '#1baf7a';
const DIVIDEND_COLOR = '#4098fc';

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

const CalendarBody: React.FC<CalendarBodyProps> = ({ bondPositions, sharePositions, accountsMoney }) => {
    const {
        events,
        byMonth,
        couponTotal,
        dividendTotal,
        dividendProjectedTotal,
        payingValue,
        payingValueByUid,
        hasNonRub,
        hasUnconvertible,
        ratesDate,
        status,
        isFetching,
        refetch
    } = usePaymentsCalendar(bondPositions, sharePositions);
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const screens = Grid.useBreakpoint();
    const isMobile = screens.md === false;
    const [showForecast, setShowForecast] = React.useState(true);
    const [onlyPaying, setOnlyPaying] = React.useState(false);
    const [kindFilter, setKindFilter] = React.useState<'all' | CalendarKind>('all');

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
    // Сводный итог за окно (12 мес) — купоны + дивиденды (с учётом прогноза, если включён).
    const yearlyTotal = round(couponTotal + dividendTileTotal);
    const monthlyAvg = round(yearlyTotal / 12);
    // Доходность выплатами, % годовых. Основная база — стоимость платящих бумаг
    // (как в Snowball); подпись — та же сумма к полной стоимости счетов.
    // Чекбокс «только по платящим» сужает базу до бумаг, реально дающих выплаты в
    // окне. Набор берём из тех же событий, что кормят числитель (с учётом тумблера
    // прогноза) — иначе бумага с одним лишь прогнозным дивидендом завысила бы %.
    const payingIds = new Set(
        events.filter((e) => showForecast || !e.projected).map((e) => e.instrumentId)
    );
    const payingActiveValue = round(
        Array.from(payingIds).reduce((sum, id) => sum + (payingValueByUid.get(id) ?? 0), 0)
    );
    const yieldBase = onlyPaying ? payingActiveValue : payingValue;
    const yieldPct = yieldBase > 0 ? (yearlyTotal / yieldBase) * 100 : null;
    const wholePct = accountsMoney > 0 ? (yearlyTotal / accountsMoney) * 100 : null;

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

    return (
        <div>
            <div className='flex items-center justify-between gap-3 mb-4 flex-wrap'>
                <div
                    className='grid gap-3'
                    style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', flex: 1, minWidth: 260 }}
                >
                    <TotalTile
                        label='Всего за 12 мес'
                        value={intToRub(yearlyTotal)}
                        color={palette.primary}
                        bg={`${palette.primary}14`}
                        border={`${palette.primary}40`}
                        muted={palette.textMuted}
                        sub={`≈ ${intToRub(monthlyAvg)} в месяц`}
                    />
                    <TotalTile
                        label='Доходность выплатами · % годовых'
                        value={yieldPct !== null ? formatPct(yieldPct) : '—'}
                        color={palette.primary}
                        bg={`${palette.primary}14`}
                        border={`${palette.primary}40`}
                        muted={palette.textMuted}
                        sub={
                            onlyPaying
                                ? `по ${payingIds.size} ${plsBumag(payingIds.size)}`
                                : wholePct !== null
                                  ? `≈ ${formatPct(wholePct)} ко всему счёту`
                                  : undefined
                        }
                    />
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

            <div className='flex items-center gap-2 mb-4'>
                <Checkbox checked={onlyPaying} onChange={(e) => setOnlyPaying(e.target.checked)}>
                    <span style={{ color: palette.textMuted, fontSize: 13 }}>
                        Доходность только по платящим бумагам
                    </span>
                </Checkbox>
                <Tooltip title='База % считается только по бумагам, дающим купоны/дивиденды в ближайшие 12 мес — без «молчащих» акций и фондов. Иначе — по всем облигациям, акциям и фондам.'>
                    <InfoCircleOutlined style={{ color: palette.textMuted }} />
                </Tooltip>
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
                    message={`Валютные выплаты пересчитаны в рубли по курсу ЦБ${
                        ratesDate ? ` на ${ratesDate}` : ''
                    } и включены в итог.`}
                />
            ) : null}

            {hasUnconvertible ? (
                <Alert
                    type='warning'
                    showIcon
                    className='mb-4'
                    message='Часть выплат в валюте без известного курса ЦБ — они не вошли в рублёвый итог и график.'
                />
            ) : null}

            {visibleEvents.length ? (
                <>
                    <div className='mb-5'>
                        <ReactECharts option={chartOption} style={{ height: 240 }} notMerge lazyUpdate />
                    </div>
                    <PaymentsList
                        events={visibleEvents}
                        resetKey={`${kindFilter}-${showForecast}`}
                    />
                </>
            ) : (
                <Empty description='Нет предстоящих выплат в ближайшие 12 месяцев' />
            )}
        </div>
    );
};

const round = (n: number) => Number(n.toFixed(2));

interface PaymentsCalendarProps {
    /** Счета портфеля — из них строим фильтр и позиции для календаря. */
    accounts: AccountPortfolio[];
}

/**
 * Обёртка календаря: мультивыбор счетов + сводка «деньги на выбранных счетах».
 * Позиции выбранных счетов схлопываем и отдаём в тело календаря — так статистика
 * выплат считается точечно по нужным счетам.
 */
const PaymentsCalendar: React.FC<PaymentsCalendarProps> = ({ accounts }) => {
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);

    // Кандидаты фильтра — счета с уже загруженным портфелем.
    const loaded = accounts.filter((a) => a.portfolio);
    const allIds = loaded.map((a) => a.account.id);

    // null = «все счета» (дефолт). Явный выбор храним массивом id.
    const [selected, setSelected] = React.useState<string[] | null>(null);
    const selectedIds = (selected ?? allIds).filter((id) => allIds.includes(id));
    const selectedAccounts = loaded.filter((a) => selectedIds.includes(a.account.id));

    // Один инструмент на нескольких выбранных счетах схлопываем (иначе задвоятся
    // события и ключи строк в календаре).
    const positions = mergePositions(selectedAccounts.flatMap((a) => a.portfolio?.positions ?? []));
    const bondPositions = positions.filter((p) => p.instrumentType === 'bond');
    const sharePositions = positions.filter(
        (p) => p.instrumentType === 'share' || p.instrumentType === 'etf'
    );
    const accountsMoney = selectedAccounts.reduce(
        (sum, a) => sum + (a.portfolio?.totalAmountPortfolio ?? 0),
        0
    );

    const allSelected = selectedIds.length === loaded.length;

    return (
        <div>
            {loaded.length > 1 ? (
                <div
                    className='mb-4'
                    style={{
                        background: palette.containerBg,
                        border: `1px solid ${palette.border}`,
                        borderRadius: 12,
                        padding: '12px 16px'
                    }}
                >
                    <div className='flex items-center justify-between gap-3 flex-wrap mb-2'>
                        <span style={{ fontSize: 13, color: palette.textMuted }}>Счета</span>
                        <div className='flex items-center gap-3'>
                            <span style={{ fontSize: 13, color: palette.textMuted }}>
                                Выбрано {selectedIds.length} из {loaded.length}
                            </span>
                            <Button
                                type='link'
                                size='small'
                                style={{ padding: 0 }}
                                onClick={() => setSelected(allSelected ? [] : allIds)}
                            >
                                {allSelected ? 'Снять все' : 'Выбрать все'}
                            </Button>
                        </div>
                    </div>
                    <Checkbox.Group value={selectedIds} onChange={(v) => setSelected(v as string[])}>
                        <div className='flex flex-wrap gap-x-5 gap-y-2'>
                            {loaded.map((a) => (
                                <Checkbox key={a.account.id} value={a.account.id}>
                                    <span>{a.account.name}</span>
                                    <span style={{ color: palette.textMuted, marginLeft: 6 }}>
                                        {intToRub(a.portfolio?.totalAmountPortfolio ?? 0)}
                                    </span>
                                </Checkbox>
                            ))}
                        </div>
                    </Checkbox.Group>
                    <div
                        style={{
                            marginTop: 12,
                            paddingTop: 12,
                            borderTop: `1px solid ${palette.border}`,
                            fontSize: 14
                        }}
                    >
                        <span style={{ color: palette.textMuted }}>Деньги на выбранных счетах: </span>
                        <b style={{ color: palette.primary }}>{intToRub(accountsMoney)}</b>
                    </div>
                </div>
            ) : null}

            <CalendarBody
                bondPositions={bondPositions}
                sharePositions={sharePositions}
                accountsMoney={accountsMoney}
            />
        </div>
    );
};

export default PaymentsCalendar;
