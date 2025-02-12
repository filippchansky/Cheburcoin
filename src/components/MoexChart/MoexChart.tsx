'use client';
import {
    getFiveDayAgo,
    getFiveYearsAgo,
    getNormalDate,
    getTwoMonthsAgo,
    getWeekAgo,
    getYearAgo
} from '@/utils/dateUtils';
import { getChart } from '@api/moex/shares/getChart';
import { ISharesChart } from '@models/SharesCharts';
import { Button, ButtonGroup, Skeleton, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
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

    const handleAlignment = (event: React.MouseEvent<HTMLElement>, newAlignment: string | null) => {
        if (newAlignment) {
            setInterval(newAlignment);
        }
    };

    const { data, isLoading } = useQuery<ISharesChart>({
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

    console.log(chartData)

    const getWindowWidth = () => (typeof window !== 'undefined' ? window.innerWidth : 0);

    return (
        <div className='flex flex-col gap-3 max-w-[1000px] w-full max-h-[700px] h-full items-start'>
            <ToggleButtonGroup
                value={interval}
                exclusive
                onChange={handleAlignment}
                aria-label='text alignment'
                style={{ paddingLeft: '50px' }}
            >
                <ToggleButton value={'60'} aria-label='justified'>
                    Hour
                </ToggleButton>
                <ToggleButton value={'24'} aria-label='justified'>
                    Day
                </ToggleButton>
                <ToggleButton value={'7'} aria-label='right'>
                    Week
                </ToggleButton>
                <ToggleButton value={'31'} aria-label='right'>
                    Month
                </ToggleButton>
            </ToggleButtonGroup>
            {!chartData ? (
                <div className={style.chartSkeleton}>
                    <Skeleton variant='rounded' height='100%' width={'100%'}/>
                </div>
            ) : (
                <LineChart
                    xAxis={[
                        {
                            data: chartData?.map((d) =>
                                interval !== '60' ? d.date.slice(0, -5) : d.date
                            ),
                            scaleType: 'point'
                        }
                    ]}
                    series={[
                        {
                            data: chartData?.map((d) => d.close as number),
                            showMark: false,
                            curve: 'linear',
                            color: 'rgba(0, 4, 255, 1)' ,// Цвет линии
                            // area: true, // Включаем заливку
                        }
                    ]}
                    className={style.chart}
                    width={getWindowWidth() < 1000 ? getWindowWidth() : 1000}
                    height={getWindowWidth() < 600 ? 300 : 600}
                    leftAxis={null}
                    rightAxis={getWindowWidth() < 600 ? null : 'DEFAULT_Y_AXIS_KEY'}
                />
            )}
        </div>
    );
};
export default MoexChart;
