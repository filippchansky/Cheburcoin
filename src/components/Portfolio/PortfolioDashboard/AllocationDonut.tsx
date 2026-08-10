'use client';
import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { intToRub } from '@/utils/formatCurrency';
import { instrumentTypeLabel } from '@/utils/instrumentType';
import { AllocationSlice } from '@/utils/portfolioScope';

interface AllocationDonutProps {
    allocation: AllocationSlice[];
    total: number;
}

/** Цвета срезов по типу инструмента (hex — ECharts не понимает CSS-переменные). */
const TYPE_COLOR: Record<string, string> = {
    share: '#2a78d6',
    bond: '#1baf7a',
    etf: '#7f77dd',
    currency: '#eda100',
    futures: '#eb6834'
};

const AllocationDonut: React.FC<AllocationDonutProps> = ({ allocation, total }) => {
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: (params: { name: string; value: number; percent: number }) =>
                `${params.name}<br/>${intToRub(params.value)} · ${params.percent}%`
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
                data: allocation.map((slice) => ({
                    name: instrumentTypeLabel(slice.type),
                    value: Number(slice.value.toFixed(2)),
                    itemStyle: { color: TYPE_COLOR[slice.type] ?? palette.textMuted }
                }))
            }
        ]
    };

    return (
        <div className='relative'>
            <ReactECharts option={option} style={{ height: 200 }} notMerge lazyUpdate />
            <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
                <span style={{ color: palette.textMuted, fontSize: 12 }}>Всего</span>
                <span style={{ fontSize: 16, fontWeight: 500 }}>{intToRub(total)}</span>
            </div>
        </div>
    );
};
export default AllocationDonut;
