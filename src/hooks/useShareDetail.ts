import { useMemo } from 'react';
import { getShareCandles } from '@api/moex/shares/getShareCandles';
import { getShareDetail } from '@api/moex/shares/getShareDetail';
import { getShareIndices } from '@api/moex/shares/getShareIndices';
import { mapShareDetail } from '@api/moex/shares/mapShareDetail';
import { getShareDividendsTinkoff } from '@api/tinkoff/getShareDividends/getShareDividends';
import { IShareDividend } from '@models/shareDetail';
import { useQuery } from '@tanstack/react-query';
import { useTbank } from './useTbank';

/** Полные данные одной акции (маркетдата TQBR + карточка бумаги). */
export const useShareDetail = (ticker: string) =>
    useQuery({
        queryKey: ['share-detail', ticker],
        queryFn: () => getShareDetail(ticker),
        select: mapShareDetail,
        enabled: !!ticker
    });

/** Результат хука дивидендов бумаги. */
export interface ShareDividendsData {
    /** Выплаты, свежие сверху ([0] — последняя). */
    dividends: IShareDividend[];
    /** Историческая дивдоходность на дату отсечки: дата → %|null (данные Т-Банка). */
    yieldByDate: Map<string, number | null>;
    /** Данные ещё грузятся (или ждём токен Т-Банка). */
    isLoading: boolean;
    /** Токена Т-Банка нет — источник дивидендов недоступен (не «нет выплат»). */
    noToken: boolean;
}

// Окно запроса истории: от 2015 (как ALL_TIME_FROM в остальных выплатах) до
// +400 дней вперёд, чтобы захватить уже объявленные будущие дивиденды.
// Время дня обнуляем — иначе `to` меняется на каждый рендер (миллисекунды),
// queryKey «плывёт» и react-query уходит в бесконечный рефетч. Так граница
// стабильна в пределах суток (и кэш переиспользуется между бумагами).
const dividendWindow = () => {
    const to = new Date();
    to.setDate(to.getDate() + 400);
    to.setHours(0, 0, 0, 0);
    return { from: '2015-01-01T00:00:00.000Z', to: to.toISOString() };
};

/**
 * История дивидендов бумаги. Источник — Т-Банк (GetDividends): MOEX закрыл
 * бесплатную выдачу дивидендов (данные ушли в платный /iss/cci/corp-actions).
 * Поэтому нужен токен пользователя; без него отдаём `noToken` — страница
 * покажет честную заглушку вместо ложного «не выплачивала дивиденды».
 */
export const useShareDividends = (ticker: string): ShareDividendsData => {
    const { data: tbank, isLoading: tbankLoading } = useTbank();
    const token = tbank?.token ?? null;
    const { from, to } = dividendWindow();

    const query = useQuery({
        queryKey: ['share-dividends', ticker, from, to],
        queryFn: () => getShareDividendsTinkoff(ticker, from, to, token as string),
        enabled: !!ticker && !!token,
        staleTime: 1000 * 60 * 60
    });

    const rows = useMemo(() => query.data ?? [], [query.data]);

    const dividends = useMemo<IShareDividend[]>(
        () => rows.map(({ date, value, currency }) => ({ date, value, currency })),
        [rows]
    );

    const yieldByDate = useMemo(() => {
        const map = new Map<string, number | null>();
        for (const row of rows) map.set(row.date, row.yield ?? null);
        return map;
    }, [rows]);

    return {
        dividends,
        yieldByDate,
        isLoading: tbankLoading || (query.isLoading && !!token),
        noToken: !tbankLoading && !token
    };
};

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
