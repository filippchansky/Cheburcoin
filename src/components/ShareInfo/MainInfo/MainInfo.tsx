import React, { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getChart } from '../../../../apiFn/moex/shares/getChart';
import { getMonthAgo, getSixMonthAgo, getYearAgo } from '@/utils/dateUtils';
import { ISharesChart } from '@models/SharesCharts';
import { calculatePriceChangePercentage } from '@/utils/getPercentage';
import PrecentValue from './PrecentValue/PrecentValue';

interface MainInfoProps {
    ticker: string;
}

const getClose = (item: ISharesChart | undefined) => {
    if (item && item.candles.data.length > 0) {
        const previousClose = item.candles.data.at(0)?.[1] || 0;
        const currentClose = item.candles.data.at(-1)?.[1] || 0;
        return { previousClose, currentClose };
    }
    return { previousClose: 0, currentClose: 0 };
};

const MainInfo: React.FC<MainInfoProps> = ({ ticker }) => {
    const queries = useQueries({
        queries: [
            {
                queryKey: ['day', ticker],
                queryFn: () => {
                    const today = new Date().toISOString().split('T')[0];
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

    const isAllSuccess = queries.every((query) => query.isSuccess);

    const average = useMemo(() => {
        if (!isAllSuccess) {
            return { day: null, month: null, sixMonth: null, year: null };
        }
        const change = (item: ISharesChart | undefined) => {
            const { previousClose, currentClose } = getClose(item);
            return calculatePriceChangePercentage(previousClose, currentClose);
        };
        return {
            day: change(queries[0]?.data),
            month: change(queries[1]?.data),
            sixMonth: change(queries[2]?.data),
            year: change(queries[3]?.data)
        };
    }, [isAllSuccess, queries]);

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
