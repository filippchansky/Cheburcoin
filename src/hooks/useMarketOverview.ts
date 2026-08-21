import { useQuery } from '@tanstack/react-query';
import { getImoex } from '@api/moex/market/getImoex';

const MINUTE = 1000 * 60;

export interface KeyRate {
    rate: number;
    date: string;
}

/** Ключевая ставка ЦБ (серверный роут /api/key-rate). Меняется редко. */
export const useKeyRate = () =>
    useQuery<KeyRate>({
        queryKey: ['key-rate'],
        queryFn: async () => {
            const res = await fetch('/api/key-rate');
            if (!res.ok) throw new Error('key-rate');
            return res.json();
        },
        staleTime: MINUTE * 60
    });

/** Индекс Мосбиржи (IMOEX), обновляется раз в минуту в торговые часы. */
export const useImoex = () =>
    useQuery({
        queryKey: ['imoex'],
        queryFn: getImoex,
        refetchInterval: MINUTE,
        staleTime: MINUTE
    });

export interface FuturesQuote {
    secid: string;
    name: string;
    price: number;
    changePct: number;
}

export interface MarketFutures {
    usd: FuturesQuote | null;
    cny: FuturesQuote | null;
    brent: FuturesQuote | null;
}

export interface CbrRates {
    usd: number | null;
    eur: number | null;
    cny: number | null;
    /** Карта «код валюты (USD/EUR/…) → рублёвый курс за 1 ед.». */
    rates: Record<string, number>;
    date: string | null;
}

/** Официальный курс ЦБ (серверный роут /api/cbr-rates). Обновляется раз в день. */
export const useCbrRates = () =>
    useQuery<CbrRates>({
        queryKey: ['cbr-rates'],
        queryFn: async () => {
            const res = await fetch('/api/cbr-rates');
            if (!res.ok) throw new Error('cbr-rates');
            return res.json();
        },
        staleTime: MINUTE * 60
    });

/** Валюты (вечные фьючерсы) и нефть Brent (серверный роут /api/market-futures). */
export const useMarketFutures = () =>
    useQuery<MarketFutures>({
        queryKey: ['market-futures'],
        queryFn: async () => {
            const res = await fetch('/api/market-futures');
            if (!res.ok) throw new Error('market-futures');
            return res.json();
        },
        refetchInterval: MINUTE,
        staleTime: MINUTE
    });

export interface MarketMapItem {
    ticker: string;
    name: string;
    weight: number;
    changePct: number | null;
    last: number | null;
}

/** Карта рынка: состав IMOEX с весами и дневным % (серверный роут /api/market-map). */
export const useMarketMap = () =>
    useQuery<MarketMapItem[]>({
        queryKey: ['market-map'],
        queryFn: async () => {
            const res = await fetch('/api/market-map');
            if (!res.ok) throw new Error('market-map');
            const json = await res.json();
            return json.items as MarketMapItem[];
        },
        refetchInterval: MINUTE,
        staleTime: MINUTE
    });

export interface DividendEvent {
    ticker: string;
    date: string;
    value: number;
    currency: string;
}

/** Ближайшие дивидендные отсечки по бумагам IMOEX (серверный роут /api/dividends-calendar). */
export const useDividendsCalendar = () =>
    useQuery<DividendEvent[]>({
        queryKey: ['dividends-calendar'],
        queryFn: async () => {
            const res = await fetch('/api/dividends-calendar');
            if (!res.ok) throw new Error('dividends-calendar');
            const json = await res.json();
            return json.items as DividendEvent[];
        },
        staleTime: MINUTE * 60
    });
