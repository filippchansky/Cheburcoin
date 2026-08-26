'use client';
import { useMemo } from 'react';
import { parseAsInteger, parseAsJson, parseAsString, useQueryState } from 'nuqs';

/**
 * Минимальная форма фильтра, нужная хуку: только ключ. Конкретные страницы
 * (облигации/акции/фонды) передают свои BondFilter/ShareFilter/FundFilter —
 * они шире, но структурно совместимы.
 */
interface FilterLike {
    key: string;
}

interface UseTableUrlStateResult<V> {
    /** Строка поиска (query-параметр `q`). */
    search: string;
    /** Задать поиск и вернуться на первую страницу. Пустая строка чистит `q`. */
    setSearch: (value: string) => void;
    /** Текущая страница таблицы (1-based, query-параметр `page`). */
    page: number;
    /** Смена страницы (десктоп-пагинация и мобильный «Показать ещё»). */
    setPage: (page: number) => void;
    /** Полный набор значений фильтров: дефолты, перекрытые активными из URL. */
    filters: Record<string, V>;
    /** Изменить один фильтр (сбрасывает страницу на первую). */
    setFilter: (key: string, value: V) => void;
    /** Вернуть фильтр к значению по умолчанию. */
    clearFilter: (key: string) => void;
    /** Сбросить все фильтры к дефолтам. */
    resetAll: () => void;
}

/**
 * Держит поиск, номер страницы и фильтры таблицы в URL (через nuqs). Благодаря
 * этому переход на карточку инструмента и «Назад» возвращают ровно те же фильтры
 * и позицию (браузерный scroll restoration добирает прокрутку), а свежий вход на
 * страницу из меню открывается с чистыми дефолтами. В `f` пишем только активные
 * (отличные от дефолта) фильтры, чтобы не раздувать строку.
 *
 * @param allFilters   список описаний фильтров страницы (нужны их `key`)
 * @param defaults     значения фильтров по умолчанию (тот же Record, что в useState раньше)
 * @param isFilterActive предикат «значение отличается от дефолта» (у каждой страницы свой)
 */
export function useTableUrlState<F extends FilterLike, V>(
    allFilters: F[],
    defaults: Record<string, V>,
    isFilterActive: (filter: F, value: V) => boolean
): UseTableUrlStateResult<V> {
    const [searchRaw, setSearchRaw] = useQueryState('q', parseAsString.withDefault(''));
    const [page, setPageRaw] = useQueryState('page', parseAsInteger.withDefault(1));
    const [filtersParam, setFiltersParam] = useQueryState(
        'f',
        parseAsJson<Record<string, V>>((value) => value as Record<string, V>).withDefault({})
    );

    const filters = useMemo(
        () => ({ ...defaults, ...filtersParam }),
        [defaults, filtersParam]
    );

    const setPage = (next: number) => setPageRaw(next);

    const setSearch = (value: string) => {
        setSearchRaw(value || null);
        setPageRaw(1);
    };

    /** Записать фильтры в URL, оставив только активные, и вернуться на первую страницу. */
    const writeFilters = (next: Record<string, V>) => {
        const active: Record<string, V> = {};
        for (const filter of allFilters) {
            const value = next[filter.key];
            if (value !== undefined && isFilterActive(filter, value)) active[filter.key] = value;
        }
        setFiltersParam(Object.keys(active).length > 0 ? active : null);
        setPageRaw(1);
    };

    const setFilter = (key: string, value: V) => writeFilters({ ...filters, [key]: value });
    const clearFilter = (key: string) => setFilter(key, defaults[key]);
    const resetAll = () => writeFilters(defaults);

    return { search: searchRaw, setSearch, page, setPage, filters, setFilter, clearFilter, resetAll };
}
