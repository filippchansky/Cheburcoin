'use client';
import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { intToRub } from '@/utils/formatCurrency';
import { AllocSlice } from '@/utils/portfolioAllocation';

interface AllocationDonutProps {
    slices: AllocSlice[];
    total: number;
}

const AllocationDonut: React.FC<AllocationDonutProps> = ({ slices, total }) => {
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
                data: slices.map((slice) => ({
                    name: slice.label,
                    value: slice.value,
                    itemStyle: { color: slice.color }
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
