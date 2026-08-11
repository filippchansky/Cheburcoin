import { getFundCandles } from '@api/moex/funds/getFundCandles';
import { getFundDetail } from '@api/moex/funds/getFundDetail';
import { mapFundDetail } from '@api/moex/funds/mapFundDetail';
import { useQuery } from '@tanstack/react-query';

/** Полные данные одного фонда (маркетдата TQBR + карточка бумаги). */
export const useFundDetail = (ticker: string) =>
    useQuery({
        queryKey: ['fund-detail', ticker],
        queryFn: () => getFundDetail(ticker),
        select: mapFundDetail,
        enabled: !!ticker
    });

/** Свечи фонда за период (для графика цены и расчёта 52-нед. диапазона). */
export const useFundCandles = (ticker: string, from: string, interval = '24') =>
    useQuery({
        queryKey: ['fund-candles', ticker, from, interval],
        queryFn: () => getFundCandles(ticker, from, interval),
        enabled: !!ticker && !!from
    });
