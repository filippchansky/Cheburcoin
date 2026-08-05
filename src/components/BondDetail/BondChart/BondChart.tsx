'use client';
import React, { useState } from 'react';
import { Segmented, Skeleton } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useBondCandles } from '@/hooks/useBonds';
import { getMonthAgo, getSixMonthAgo, getYearAgo } from '@/utils/dateUtils';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import style from './style.module.scss';

interface BondChartProps {
    secid: string;
}

type Period = 'month' | 'sixMonth' | 'year';

const periods = [
    { label: '1 месяц', value: 'month' },
    { label: '6 месяцев', value: 'sixMonth' },
    { label: '1 год', value: 'year' }
];

const fromByPeriod: Record<Period, () => string> = {
    month: getMonthAgo,
    sixMonth: getSixMonthAgo,
    year: getYearAgo
};

const BondChart: React.FC<BondChartProps> = ({ secid }) => {
    const [period, setPeriod] = useState<Period>('sixMonth');
    const { data: candles = [], isLoading } = useBondCandles(secid, fromByPeriod[period]());
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);

    const options = {
        tooltip: {
            trigger: 'axis',
            valueFormatter: (value: number) => `${value?.toFixed(2)}%`
        },
        grid: { left: 8, right: 16, bottom: 8, top: 16, containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: candles.map((c) => c.date.slice(5).split('-').reverse().join('.')),
            axisLine: { lineStyle: { color: palette.border } },
            axisLabel: { color: palette.textMuted }
        },
        yAxis: {
            type: 'value',
            scale: true,
            axisLabel: { color: palette.textMuted, formatter: '{value}%' },
            splitLine: { lineStyle: { color: palette.border } }
        },
        series: [
            {
                name: 'Цена',
                type: 'line',
                showSymbol: false,
                smooth: true,
                sampling: 'lttb',
                lineStyle: { color: palette.primary, width: 2 },
                itemStyle: { color: palette.primary },
                areaStyle: { color: palette.primary, opacity: 0.08 },
                data: candles.map((c) => c.close)
            }
        ]
    };

    return (
        <section className={style.wrapper}>
            <div className={style.head}>
                <h2 className={style.title}>Цена, % от номинала</h2>
                <Segmented
                    value={period}
                    onChange={(value) => setPeriod(value as Period)}
                    options={periods}
                />
            </div>
            {isLoading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
                <ReactECharts option={options} style={{ height: 360 }} notMerge lazyUpdate />
            )}
        </section>
    );
};
export default BondChart;
