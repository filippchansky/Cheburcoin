import React, { useEffect, useMemo, useState } from 'react';
import style from './style.module.scss';
import { useQueries, useQuery } from '@tanstack/react-query';
import { getChart } from '../../../../apiFn/moex/shares/getChart';
import { getMonthAgo, getSixMonthAgo, getYearAgo } from '@/utils/dateUtils';
import { ISharesChart } from '@models/SharesCharts';
import { calculatePriceChangePercentage } from '@/utils/getPercentage';
import PrecentValue from './PrecentValue/PrecentValue';

interface MainInfoProps {
    ticker: string;
}

interface IAverage {
    day: number | null;
    month: number | null;
    sixMonth: number | null;
    year: number | null;
}

const MainInfo: React.FC<MainInfoProps> = ({ ticker }) => {
    const [average, setAverage] = useState<IAverage>({
        day: null,
        month: null,
        sixMonth: null,
        year: null
    });

    const queries = useQueries({
        queries: [
            {
                queryKey: ['day', ticker],
                queryFn: () => {
                    const currentDate = new Date();
                    const today = currentDate.toISOString().split('T')[0];
                    return getChart(ticker, today, '60');
                }
            },
            {
                queryKey: ['month', ticker],
                queryFn: () => getChart(ticker, getMonthAgo(), '24')
            },
            {
                queryKey: ['sixMonth', ticker],
                queryFn: () => getChart(ticker, getSixMonthAgo(), '24')
            },
            {
                queryKey: ['year', ticker],
                queryFn: () => getChart(ticker, getYearAgo(), '24')
            }
        ]
    });

    const isAllSuccess = useMemo(() => queries.every((query) => query.isSuccess), [queries]);

    const getClose = (item: ISharesChart | undefined) => {
        if (item && item.candles.data.length > 0) {
            const previousClose = item.candles.data.at(0)?.[1] || 0;
            const currentClose = item.candles.data.at(-1)?.[1] || 0;
            return { previousClose, currentClose };
        }
        return { previousClose: 0, currentClose: 0 };
    };
    useEffect(() => {
        // Проверяем, все ли запросы завершены

        if (isAllSuccess) {
            setAverage({
                day: calculatePriceChangePercentage(
                    getClose(queries[0]?.data)?.previousClose,
                    getClose(queries[0]?.data)?.currentClose
                ),
                month: calculatePriceChangePercentage(
                    getClose(queries[1]?.data)?.previousClose,
                    getClose(queries[1]?.data)?.currentClose
                ),
                sixMonth: calculatePriceChangePercentage(
                    getClose(queries[2]?.data)?.previousClose,
                    getClose(queries[2]?.data)?.currentClose
                ),
                year: calculatePriceChangePercentage(
                    getClose(queries[3]?.data)?.previousClose,
                    getClose(queries[3]?.data)?.currentClose
                )
            });
        }
    }, [isAllSuccess]);

    return (
        <div className='flex justify-around'>
            <PrecentValue average={average.day} title='День' />
            <PrecentValue average={average.month} title='Месяц' />
            <PrecentValue average={average.sixMonth} title='Полгода' />
            <PrecentValue average={average.year} title='Год' />
        </div>
    );
};
export default MainInfo;
