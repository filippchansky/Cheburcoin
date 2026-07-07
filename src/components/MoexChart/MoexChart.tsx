'use client';
import {
    getFiveDayAgo,
    getFiveYearsAgo,
    getNormalDate,
    getTwoMonthsAgo,
    getYearAgo
} from '@/utils/dateUtils';
import { getChart } from '../../../apiFn/moex/shares/getChart';
import { ISharesChart } from '@models/SharesCharts';
import { Segmented, Skeleton } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import style from './style.module.scss';

interface MoexChartProps {
    ticker: string;
}

const MoexChart: React.FC<MoexChartProps> = ({ ticker }) => {
    const [period, setPeriod] = useState<string>('');
    const [interval, setInterval] = useState<string>('7');
    const [chartData, setChartData] = useState<
        {
            date: string;
            close: number;
        }[]
    >();

    const { data } = useQuery<ISharesChart>({
        queryKey: ['chart', ticker, period, interval],
        queryFn: () => getChart(ticker, period, interval)
    });

    useEffect(() => {
        switch (interval) {
            case '60':
                return setPeriod(getFiveDayAgo());
            case '24':
                return setPeriod(getTwoMonthsAgo());
            case '7':
                return setPeriod(getYearAgo());
            case '31':
                return setPeriod(getFiveYearsAgo());
        }
    }, [interval]);

    useEffect(() => {
        if (data) {
            const transformedData = data?.candles.data.map((item) => ({
                date: getNormalDate(item[6].slice(0, -3)), // Дата (ось X)
                close: item[1] // Цена закрытия (ось Y)
            }));
            setChartData(transformedData);
        }
    }, [data]);

    const options = {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: chartData?.map((d) => (interval !== '60' ? d.date.slice(0, -5) : d.date))
        },
        yAxis: {
            type: 'value',
            scale: true
        },
        dataZoom: [
            { type: 'inside', start: 0, end: 100 },
            { start: 0, end: 100 }
        ],
        series: [
            {
                name: ticker,
                type: 'line',
                showSymbol: false,
                sampling: 'lttb',
                itemStyle: { color: 'rgba(0, 4, 255, 1)' },
                data: chartData?.map((d) => d.close)
            }
        ]
    };

    return (
        <div className='flex h-full max-h-[700px] w-full max-w-[1000px] flex-col items-start gap-3'>
            <Segmented
                value={interval}
                onChange={(value) => setInterval(value as string)}
                options={[
                    { label: 'Hour', value: '60' },
                    { label: 'Day', value: '24' },
                    { label: 'Week', value: '7' },
                    { label: 'Month', value: '31' }
                ]}
                style={{ marginLeft: '50px' }}
            />
            {!chartData ? (
                <div className={style.chartSkeleton}>
                    <Skeleton active paragraph={{ rows: 8 }} />
                </div>
            ) : (
                <ReactECharts
                    className={style.chart}
                    option={options}
                    style={{ width: '100%', height: 500 }}
                    notMerge
                    lazyUpdate
                />
            )}
        </div>
    );
};
export default MoexChart;
