'use client';
import React, { useEffect, useState } from 'react';
import { Segmented, Skeleton } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useFundCandles } from '@/hooks/useFundDetail';
import { getMonthAgo, getSixMonthAgo, getYearAgo, getFiveYearsAgo } from '@/utils/dateUtils';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { intToCompact } from '@/utils/formatCurrency';
import style from './style.module.scss';

interface FundChartProps {
    ticker: string;
}

type Period = 'month' | 'sixMonth' | 'year' | 'fiveYears';

const periods = [
    { label: '1 месяц', value: 'month' },
    { label: '6 месяцев', value: 'sixMonth' },
    { label: '1 год', value: 'year' },
    { label: '5 лет', value: 'fiveYears' }
];

// Внутри дня свечи слишком дробные для длинных периодов — на 5 лет берём недельные.
const configByPeriod: Record<Period, { from: () => string; interval: string }> = {
    month: { from: getMonthAgo, interval: '24' },
    sixMonth: { from: getSixMonthAgo, interval: '24' },
    year: { from: getYearAgo, interval: '24' },
    fiveYears: { from: getFiveYearsAgo, interval: '7' }
};

/** Отслеживает, узкий ли вьюпорт (телефон). SSR-безопасно: до маунта — false. */
const useIsMobile = (maxWidth = 640): boolean => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, [maxWidth]);
    return isMobile;
};

const FundChart: React.FC<FundChartProps> = ({ ticker }) => {
    const [period, setPeriod] = useState<Period>('year');
    const { from, interval } = configByPeriod[period];
    const { data: candles = [], isLoading } = useFundCandles(ticker, from(), interval);
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const isMobile = useIsMobile();

    const rising = candles.length > 1 && candles[candles.length - 1].close >= candles[0].close;
    const lineColor = rising ? '#00a328' : '#e5484d';

    const options = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            valueFormatter: (value: number) => `${value?.toFixed(2)} ₽`
        },
        grid: isMobile
            ? { left: 2, right: 8, bottom: 36, top: 16, containLabel: true }
            : { left: 8, right: 16, bottom: 40, top: 16, containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: candles.map((c) => c.date.split('-').reverse().join('.')),
            axisLine: { lineStyle: { color: palette.border } },
            axisLabel: {
                color: palette.textMuted,
                ...(isMobile ? { showMinLabel: false, showMaxLabel: false } : {})
            }
        },
        yAxis: [
            {
                type: 'value',
                scale: true,
                axisLabel: {
                    color: palette.textMuted,
                    formatter: '{value} ₽',
                    ...(isMobile
                        ? { inside: true, verticalAlign: 'bottom', padding: [0, 0, 3, 4] }
                        : {})
                },
                splitLine: { lineStyle: { color: palette.border } }
            },
            {
                type: 'value',
                show: false,
                axisLabel: { show: false },
                max: (v: { max: number }) => v.max * 4
            }
        ],
        series: [
            {
                name: 'Цена пая',
                type: 'line',
                showSymbol: false,
                smooth: true,
                sampling: 'lttb',
                lineStyle: { color: lineColor, width: 2 },
                itemStyle: { color: lineColor },
                areaStyle: { color: lineColor, opacity: 0.08 },
                data: candles.map((c) => c.close)
            },
            {
                name: 'Объём',
                type: 'bar',
                yAxisIndex: 1,
                tooltip: { valueFormatter: (value: number) => `${intToCompact(value)} паёв` },
                itemStyle: { color: palette.textMuted, opacity: 0.25 },
                data: candles.map((c) => c.volume)
            }
        ]
    };

    return (
        <section className={style.wrapper}>
            <div className={style.head}>
                <h2 className={style.title}>Цена пая и объём</h2>
                <Segmented
                    value={period}
                    onChange={(value) => setPeriod(value as Period)}
                    options={periods}
                />
            </div>
            {isLoading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
                <ReactECharts option={options} style={{ height: 380 }} notMerge lazyUpdate />
            )}
        </section>
    );
};
export default FundChart;
