'use client';
import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { Skeleton } from 'antd';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { formatAmount } from '@/utils/formatCurrency';
import type { ChartPeriod, ChartPoint, VsCurrency } from '@models/crypto';
import style from './style.module.scss';

interface CoinChartProps {
    prices: ChartPoint[];
    period: ChartPeriod;
    vs: VsCurrency;
    loading?: boolean;
}

const vsCode = (vs: VsCurrency) => (vs === 'usd' ? 'USD' : 'RUB');

/** Формат подписи оси/тултипа по периоду: внутридневной → время, длинный → дата. */
const makeAxisFormatter = (period: ChartPeriod) => (ts: number) => {
    const d = new Date(ts);
    if (period === '24h') {
        return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    if (period === '1y' || period === 'all') {
        return d.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
    }
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

/**
 * График цены монеты (area line на ECharts). Опции строим на палитре приложения
 * с прозрачным фоном — как MarketMap, а не через тяжёлую импортированную тему.
 * Цвет линии — по знаку изменения за период (первая точка → последняя).
 */
const CoinChart: React.FC<CoinChartProps> = ({ prices, period, vs, loading }) => {
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const code = vsCode(vs);

    if (loading) {
        return <Skeleton.Node active className={style.chartSkeleton} />;
    }
    if (!prices || prices.length < 2) {
        return <div className={style.chartEmpty}>Нет данных для графика</div>;
    }

    const up = prices[prices.length - 1][1] >= prices[0][1];
    const line = up ? '#00A328' : '#E5484D';
    const areaTop = up ? 'rgba(0,163,40,0.25)' : 'rgba(229,72,77,0.25)';
    const fmtAxis = makeAxisFormatter(period);

    const option = {
        backgroundColor: 'transparent',
        grid: { left: 8, right: 12, top: 16, bottom: 8, containLabel: true },
        tooltip: {
            trigger: 'axis',
            formatter: (params: { value: [number, number] }[]) => {
                const [ts, price] = params[0].value;
                const date = new Date(ts).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: 'short',
                    year: '2-digit',
                    hour: period === '24h' ? '2-digit' : undefined,
                    minute: period === '24h' ? '2-digit' : undefined
                });
                return `${date}<br/><b>${formatAmount(price, code)}</b>`;
            }
        },
        xAxis: {
            type: 'time',
            boundaryGap: false,
            axisLabel: { color: palette.textMuted, formatter: fmtAxis, hideOverlap: true },
            axisLine: { lineStyle: { color: palette.border } },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            scale: true,
            position: 'right',
            axisLabel: {
                color: palette.textMuted,
                formatter: (v: number) => formatAmount(v, code, { compact: true })
            },
            splitLine: { lineStyle: { color: palette.border, opacity: 0.5 } }
        },
        series: [
            {
                type: 'line',
                smooth: true,
                showSymbol: false,
                sampling: 'lttb',
                lineStyle: { color: line, width: 2 },
                itemStyle: { color: line },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: areaTop },
                        { offset: 1, color: 'rgba(0,0,0,0)' }
                    ])
                },
                data: prices
            }
        ]
    };

    return (
        <ReactECharts
            className={style.chart}
            option={option}
            notMerge
            lazyUpdate
            style={{ height: 360, width: '100%' }}
        />
    );
};
export default CoinChart;
