'use client';
import React from 'react';
import { Empty, Grid, Segmented, Typography } from 'antd';
import ReactECharts from 'echarts-for-react';
import { BudgetCategory, BudgetTx, TxType } from '@/lib/budget/types';
import { SummaryPeriod, categoryBreakdown, filterByPeriod, monthlySeries } from '@/lib/budget/stats';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { formatAmount } from '@/utils/formatCurrency';
import { NEGATIVE_COLOR, POSITIVE_COLOR } from '@/components/Portfolio/PortfolioDashboard/PaymentsList';

const { Text } = Typography;

const PERIOD_OPTIONS: { label: string; value: SummaryPeriod }[] = [
    { label: 'Месяц', value: 'month' },
    { label: 'Год', value: 'year' },
    { label: 'Всё', value: 'all' }
];

const TYPE_OPTIONS: { label: string; value: TxType }[] = [
    { label: 'Расходы', value: 'expense' },
    { label: 'Доходы', value: 'income' }
];

/** Короткая подпись месяца для оси: «2026-10» → «окт 26». */
const monthShort = (key: string) => {
    const [y, m] = key.split('-').map(Number);
    const mon = new Intl.DateTimeFormat('ru-RU', { month: 'short' })
        .format(new Date(y, (m || 1) - 1, 1))
        .replace('.', '');
    return `${mon} ${String(y).slice(2)}`;
};

/** Карточка-секция сводки. */
const Card: React.FC<{ title: string; extra?: React.ReactNode; children: React.ReactNode }> = ({
    title,
    extra,
    children
}) => {
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    return (
        <div
            className='flex flex-col gap-4 rounded-xl border p-4'
            style={{ background: palette.containerBg, borderColor: palette.border }}
        >
            <div className='flex flex-wrap items-center justify-between gap-3'>
                <Text strong style={{ fontSize: 15 }}>
                    {title}
                </Text>
                {extra}
            </div>
            {children}
        </div>
    );
};

interface BudgetSummaryProps {
    txs: BudgetTx[];
    categories: BudgetCategory[];
}

/**
 * Вкладка «Сводка»: структура по категориям за выбранный период (пончик +
 * список) и помесячная динамика доход/расход (сгруппированные столбики).
 */
const BudgetSummary: React.FC<BudgetSummaryProps> = ({ txs, categories }) => {
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    const [period, setPeriod] = React.useState<SummaryPeriod>('month');
    const [type, setType] = React.useState<TxType>('expense');

    const periodTxs = React.useMemo(() => filterByPeriod(txs, period), [txs, period]);
    const slices = React.useMemo(
        () => categoryBreakdown(periodTxs, categories, type),
        [periodTxs, categories, type]
    );
    const donutTotal = slices.reduce((s, x) => s + x.value, 0);
    const monthly = React.useMemo(() => monthlySeries(txs, 12), [txs]);

    const donutOption = {
        tooltip: {
            trigger: 'item',
            formatter: (p: { name: string; value: number; percent: number }) =>
                `${p.name}<br/>${formatAmount(p.value, 'RUB')} · ${p.percent}%`
        },
        series: [
            {
                type: 'pie',
                radius: ['58%', '82%'],
                center: ['50%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: { borderColor: palette.containerBg, borderWidth: 2 },
                label: { show: false },
                labelLine: { show: false },
                data: slices.map((s) => ({
                    name: `${s.icon} ${s.name}`,
                    value: s.value,
                    itemStyle: { color: s.color }
                }))
            }
        ]
    };

    const barOption = {
        grid: { top: 28, right: isMobile ? 6 : 12, bottom: 24, left: isMobile ? 4 : 8, containLabel: true },
        legend: {
            data: ['Доход', 'Расход'],
            top: 0,
            textStyle: { color: palette.textMuted },
            itemWidth: 12,
            itemHeight: 12
        },
        tooltip: {
            trigger: 'axis',
            formatter: (params: { seriesName: string; value: number; axisValue: string }[]) => {
                const head = params[0]?.axisValue ?? '';
                const lines = params
                    .map((p) => `${p.seriesName}: ${formatAmount(p.value, 'RUB')}`)
                    .join('<br/>');
                return `${head}<br/>${lines}`;
            }
        },
        xAxis: {
            type: 'category',
            data: monthly.map((b) => monthShort(b.key)),
            axisLabel: { color: palette.textMuted, fontSize: 11 },
            axisLine: { lineStyle: { color: palette.border } }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                show: !isMobile,
                color: palette.textMuted,
                fontSize: 11,
                formatter: (value: number) =>
                    new Intl.NumberFormat('ru-RU', {
                        notation: 'compact',
                        maximumFractionDigits: 1
                    }).format(value)
            },
            splitLine: { lineStyle: { color: palette.border, opacity: 0.4 } }
        },
        series: [
            {
                name: 'Доход',
                type: 'bar',
                data: monthly.map((b) => b.income),
                itemStyle: { color: POSITIVE_COLOR, borderRadius: [4, 4, 0, 0] },
                barMaxWidth: 28
            },
            {
                name: 'Расход',
                type: 'bar',
                data: monthly.map((b) => b.expense),
                itemStyle: { color: NEGATIVE_COLOR, borderRadius: [4, 4, 0, 0] },
                barMaxWidth: 28
            }
        ]
    };

    return (
        <div className='flex flex-col gap-4'>
            <Card
                title='Структура'
                extra={
                    <div className='flex flex-wrap gap-2'>
                        <Segmented<TxType>
                            size='small'
                            value={type}
                            onChange={setType}
                            options={TYPE_OPTIONS}
                        />
                        <Segmented<SummaryPeriod>
                            size='small'
                            value={period}
                            onChange={setPeriod}
                            options={PERIOD_OPTIONS}
                        />
                    </div>
                }
            >
                {slices.length ? (
                    <div className={`flex gap-4 ${isMobile ? 'flex-col' : 'items-center'}`}>
                        <div className='relative' style={{ width: isMobile ? '100%' : 220, flexShrink: 0 }}>
                            <ReactECharts option={donutOption} style={{ height: 200 }} notMerge lazyUpdate />
                            <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
                                <span style={{ color: palette.textMuted, fontSize: 12 }}>
                                    {type === 'expense' ? 'Расходы' : 'Доходы'}
                                </span>
                                <span style={{ fontSize: 16, fontWeight: 600 }}>
                                    {formatAmount(donutTotal, 'RUB', { digits: 0 })}
                                </span>
                            </div>
                        </div>
                        <div className='flex min-w-0 flex-1 flex-col'>
                            {slices.map((s) => (
                                <div
                                    key={s.id}
                                    className='flex items-center gap-2 border-b py-2 last:border-b-0'
                                    style={{ borderColor: palette.border }}
                                >
                                    <span
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: 3,
                                            background: s.color,
                                            flexShrink: 0
                                        }}
                                    />
                                    <span className='min-w-0 flex-1 truncate'>
                                        {s.icon} {s.name}
                                    </span>
                                    <Text type='secondary' className='text-xs' style={{ flexShrink: 0 }}>
                                        {s.pct.toFixed(0)}%
                                    </Text>
                                    <Text
                                        strong
                                        style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}
                                    >
                                        {formatAmount(s.value, 'RUB', { digits: 0 })}
                                    </Text>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='Нет операций за период' />
                )}
            </Card>

            <Card title='Динамика по месяцам'>
                {monthly.length ? (
                    <ReactECharts option={barOption} style={{ height: 240 }} notMerge lazyUpdate />
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='Пока нет данных' />
                )}
            </Card>
        </div>
    );
};
export default BudgetSummary;
