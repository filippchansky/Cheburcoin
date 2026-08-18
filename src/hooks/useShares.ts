import { getAllShares } from '@api/moex/shares/getAllShares';
import { getSectors } from '@api/moex/shares/getSectors';
import { mapShares } from '@api/moex/shares/mapShares';
import { columnGetter } from '@api/moex/columnUtils';
import { IShares } from '@models/allSharesData';
import { IFilteredShares } from '@models/filteredShares';
import { SharesMetaMap } from '@models/sharesMeta';
import { useQuery } from '@tanstack/react-query';

/** Список акций MOEX (TQBR), отсортированный по капитализации убыв. */
export const useShares = () =>
    useQuery({
        queryKey: ['shares'],
        queryFn: getAllShares,
        select: mapShares
    });

/** Множество тикеров привилегированных акций (SECTYPE='2') из списка TQBR. */
const selectPreferred = (raw: IShares): Set<string> => {
    const sec = columnGetter(raw.securities.columns);
    const set = new Set<string>();
    raw.securities.data.forEach((row) => {
        if (String(sec(row, 'SECTYPE')) === '2') {
            const ticker = sec<string>(row, 'SECID');
            if (ticker) set.add(ticker.toUpperCase());
        }
    });
    return set;
};

/**
 * Множество тикеров-префов MOEX — для связки обычка↔префы одного эмитента.
 * Переиспользует тот же запрос `['shares']`, что useShares (дедуп react-query),
 * лишь другой select. Меняется редко.
 */
export const usePreferredTickers = () =>
    useQuery({
        queryKey: ['shares'],
        queryFn: getAllShares,
        select: selectPreferred,
        staleTime: 1000 * 60 * 60
    });

/** Карта «тикер → сектор» из отраслевых индексов MOEX (меняется редко). */
export const useSectors = () =>
    useQuery({
        queryKey: ['sectors'],
        queryFn: getSectors,
        staleTime: 1000 * 60 * 60
    });

/**
 * Build-time карта дивидендов (public/shares-meta.json). Пустой объект, если файла
 * нет (dev/CI без запуска shares:sync) — фильтр по дивидендам тогда просто no-op.
 */
export const useSharesMeta = () =>
    useQuery<SharesMetaMap>({
        queryKey: ['shares-meta'],
        queryFn: async () => {
            const res = await fetch('/shares-meta.json');
            return res.ok ? res.json() : {};
        },
        staleTime: Infinity
    });

/** Крупнейшие по капитализации. */
export const getTopByCap = (shares: IFilteredShares[], limit = 5): IFilteredShares[] =>
    [...shares].sort((a, b) => b.capitalization - a.capitalization).slice(0, limit);

/** Топ роста за день (по проценту). */
export const getTopGainers = (shares: IFilteredShares[], limit = 5): IFilteredShares[] =>
    [...shares]
        .filter((s) => s.dayChangePercent > 0)
        .sort((a, b) => b.dayChangePercent - a.dayChangePercent)
        .slice(0, limit);

/** Топ падения за день (по проценту). */
export const getTopLosers = (shares: IFilteredShares[], limit = 5): IFilteredShares[] =>
    [...shares]
        .filter((s) => s.dayChangePercent < 0)
        .sort((a, b) => a.dayChangePercent - b.dayChangePercent)
        .slice(0, limit);
