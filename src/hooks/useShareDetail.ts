import { getShareCandles } from '@api/moex/shares/getShareCandles';
import { getShareDetail } from '@api/moex/shares/getShareDetail';
import { getShareDividends } from '@api/moex/shares/getShareDividends';
import { getShareIndices } from '@api/moex/shares/getShareIndices';
import { mapShareDetail } from '@api/moex/shares/mapShareDetail';
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
