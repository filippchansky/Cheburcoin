import { getIndices } from '@api/moex/indices/getIndices';
import { getIndexCandles } from '@api/moex/indices/getIndexCandles';
import { getIndexComposition } from '@api/moex/indices/getIndexComposition';
import { mapIndices } from '@api/moex/indices/mapIndices';
import { IIndex, IIndicesRaw } from '@models/marketIndex';
import { useQuery } from '@tanstack/react-query';

const MINUTE = 1000 * 60;

/** Индексы без текущего значения (нет данных marketdata) отсекаем — показывать нечего. */
const mapAllIndices = (raw: IIndicesRaw): IIndex[] =>
    mapIndices(raw).filter((index) => index.value !== null);

/**
 * Все индексы Московской биржи одним списком, с выведенной группой и типом расчёта.
 * В торговые часы значения «живые» — обновляем раз в минуту.
 */
export const useIndices = () =>
    useQuery({
        queryKey: ['indices', 'all'],
        queryFn: getIndices,
        select: mapAllIndices,
        refetchInterval: MINUTE,
        staleTime: MINUTE
    });

/**
 * Один индекс по SECID — берётся из того же кэша, что и список (отдельного запроса
 * на бумагу нет). Пока список грузится — undefined; загружен, но кода нет — null.
 */
export const useIndex = (secid: string) =>
    useQuery({
        queryKey: ['indices', 'all'],
        queryFn: getIndices,
        select: (raw: IIndicesRaw): IIndex | null =>
            mapAllIndices(raw).find((index) => index.secid === secid) ?? null,
        refetchInterval: MINUTE,
        staleTime: MINUTE,
        enabled: !!secid
    });

/** Свечи индекса за период (для графика значения). */
export const useIndexCandles = (secid: string, from: string, interval = '24') =>
    useQuery({
        queryKey: ['index-candles', secid, from, interval],
        queryFn: () => getIndexCandles(secid, from, interval),
        enabled: !!secid && !!from
    });

/** Состав индекса (бумаги и веса). Меняется редко — держим свежим час. */
export const useIndexComposition = (secid: string, enabled = true) =>
    useQuery({
        queryKey: ['index-composition', secid],
        queryFn: () => getIndexComposition(secid),
        enabled: !!secid && enabled,
        staleTime: MINUTE * 60
    });
