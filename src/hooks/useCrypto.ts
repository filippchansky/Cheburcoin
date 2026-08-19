import { useQuery } from '@tanstack/react-query';
import type {
    ChartPeriod,
    ICoinChart,
    ICoinDetail,
    ICoinMarket,
    IFngIndex,
    IGlobalMarket,
    INewsItem,
    VsCurrency
} from '@models/crypto';

const MINUTE = 1000 * 60;

const json = async (url: string, tag: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(tag);
    return res.json();
};

/** Таблица рынка (серверный роут /api/crypto/markets). Цены «живые» — рефетч 30с. */
export const useCryptoMarkets = (vs: VsCurrency, perPage = 100) =>
    useQuery<ICoinMarket[]>({
        queryKey: ['crypto-markets', vs, perPage],
        queryFn: async () => {
            const data = await json(
                `/api/crypto/markets?vs=${vs}&per_page=${perPage}`,
                'crypto-markets'
            );
            return data.items as ICoinMarket[];
        },
        refetchInterval: 30_000,
        staleTime: 20_000
    });

/** Верхняя полоса рынка (серверный роут /api/crypto/global). */
export const useCryptoGlobal = (vs: VsCurrency) =>
    useQuery<IGlobalMarket>({
        queryKey: ['crypto-global', vs],
        queryFn: () => json(`/api/crypto/global?vs=${vs}`, 'crypto-global'),
        refetchInterval: MINUTE,
        staleTime: MINUTE
    });

/** Индекс страха и жадности (серверный роут /api/crypto/fng). Меняется раз в день. */
export const useFng = () =>
    useQuery<IFngIndex>({
        queryKey: ['crypto-fng'],
        queryFn: () => json('/api/crypto/fng', 'crypto-fng'),
        staleTime: MINUTE * 60
    });

/** Полная карточка монеты (серверный роут /api/crypto/coin/[id]). */
export const useCoinDetail = (id: string, vs: VsCurrency) =>
    useQuery<ICoinDetail>({
        queryKey: ['crypto-coin', id, vs],
        queryFn: () => json(`/api/crypto/coin/${id}?vs=${vs}`, 'crypto-coin'),
        enabled: !!id,
        staleTime: MINUTE
    });

/** График монеты (серверный роут /api/crypto/coin/[id]/chart). */
export const useCoinChart = (id: string, vs: VsCurrency, period: ChartPeriod) =>
    useQuery<ICoinChart>({
        queryKey: ['crypto-chart', id, vs, period],
        queryFn: () =>
            json(`/api/crypto/coin/${id}/chart?vs=${vs}&period=${period}`, 'crypto-chart'),
        enabled: !!id,
        staleTime: MINUTE
    });

/** Общая крипто-лента на русском (серверный роут /api/crypto/news, RU RSS). */
export const useCryptoNews = () =>
    useQuery<INewsItem[]>({
        queryKey: ['crypto-news'],
        queryFn: async () => {
            const data = await json('/api/crypto/news', 'crypto-news');
            return data.items as INewsItem[];
        },
        staleTime: MINUTE * 5,
        refetchInterval: MINUTE * 10
    });

/** Новости по монете (серверный роут /api/crypto/news/coin, CryptoPanic по тикеру). */
export const useCoinNews = (symbol: string) =>
    useQuery<INewsItem[]>({
        queryKey: ['crypto-coin-news', symbol],
        queryFn: async () => {
            const data = await json(
                `/api/crypto/news/coin?symbol=${encodeURIComponent(symbol)}`,
                'crypto-coin-news'
            );
            return data.items as INewsItem[];
        },
        enabled: !!symbol,
        staleTime: MINUTE * 5
    });
