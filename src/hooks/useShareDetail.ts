import { useMemo } from 'react';
import { getShareCandles } from '@api/moex/shares/getShareCandles';
import { getShareDetail } from '@api/moex/shares/getShareDetail';
import { getShareDividends } from '@api/moex/shares/getShareDividends';
import { getShareIndices } from '@api/moex/shares/getShareIndices';
import { mapShareDetail } from '@api/moex/shares/mapShareDetail';
import { IShareDividend } from '@models/shareDetail';
import { historicalDividendYields } from '@/utils/shareCalc';
import { useQuery } from '@tanstack/react-query';

/** Полные данные одной акции (маркетдата TQBR + карточка бумаги). */
export const useShareDetail = (ticker: string) =>
    useQuery({
        queryKey: ['share-detail', ticker],
        queryFn: () => getShareDetail(ticker),
        select: mapShareDetail,
        enabled: !!ticker
    });

/** История дивидендов бумаги. */
export const useShareDividends = (ticker: string) =>
    useQuery({
        queryKey: ['share-dividends', ticker],
        queryFn: () => getShareDividends(ticker),
        enabled: !!ticker,
        staleTime: 1000 * 60 * 60
    });

/** Индексы, в которые входит бумага. */
export const useShareIndices = (ticker: string) =>
    useQuery({
        queryKey: ['share-indices', ticker],
        queryFn: () => getShareIndices(ticker),
        enabled: !!ticker,
        staleTime: 1000 * 60 * 60
    });

/** Свечи акции за период (для графика цены и расчёта 52-нед. диапазона). */
export const useShareCandles = (ticker: string, from: string, interval = '24') =>
    useQuery({
        queryKey: ['share-candles', ticker, from, interval],
        queryFn: () => getShareCandles(ticker, from, interval),
        enabled: !!ticker && !!from
    });

/**
 * Историческая дивдоходность на дату отсечки для каждой выплаты.
 * Тянет дневные свечи от самой ранней отсечки и джойнит их с дивидендами.
 * `dividends` отсортированы по дате убыв. — самая ранняя выплата в конце.
 */
export const useDividendYields = (ticker: string, dividends: IShareDividend[]) => {
    const from = dividends.at(-1)?.date ?? '';
    const { data: candles = [], isLoading } = useShareCandles(ticker, from, '24');

    const yieldByDate = useMemo(
        () => historicalDividendYields(dividends, candles),
        [dividends, candles]
    );

    return { yieldByDate, isLoading: isLoading && !!from };
};
