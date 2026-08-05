import { getAllShares } from '@api/moex/shares/getAllShares';
import { mapShares } from '@api/moex/shares/mapShares';
import { IFilteredShares } from '@models/filteredShares';
import { useQuery } from '@tanstack/react-query';

/** Список акций MOEX (TQBR), отсортированный по капитализации убыв. */
export const useShares = () =>
    useQuery({
        queryKey: ['shares'],
        queryFn: getAllShares,
        select: mapShares
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
