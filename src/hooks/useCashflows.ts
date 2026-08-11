import { useQueries } from '@tanstack/react-query';
import { getCashflows } from '@api/tinkoff/getCashflows/getCashflows';
import { ICashflowPoint } from '@models/tinkoffData';
import { useTbank } from './useTbank';

/** Внешние потоки одного «среза» (счёт или все счета) за всё время + сверочные итоги. */
export interface CashflowsScope {
    /** Знаковые потоки по дням (для XIRR), без терминальной стоимости. */
    items: ICashflowPoint[];
    hasNonRub: boolean;
    contributions: number;
    distributions: number;
}

export type CashflowsStatus = 'empty' | 'loading' | 'error' | 'ready';

export interface UseCashflowsResult {
    byAccount: Record<string, CashflowsScope>;
    all: CashflowsScope;
    status: CashflowsStatus;
    isFetching: boolean;
}

const ALL_TIME_FROM = '2015-01-01T00:00:00.000Z';
const buildTo = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 0);
    return end.toISOString();
};

const round2 = (n: number) => Number(n.toFixed(2));
const EMPTY: CashflowsScope = { items: [], hasNonRub: false, contributions: 0, distributions: 0 };

/** Схлопывает потоки нескольких счетов в один ряд, суммируя по дню. */
const mergeItems = (lists: ICashflowPoint[][]): ICashflowPoint[] => {
    const byDay = new Map<string, number>();
    lists.forEach((list) =>
        list.forEach((p) => byDay.set(p.date, round2((byDay.get(p.date) ?? 0) + p.amount)))
    );
    return Array.from(byDay.entries())
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Внешние денежные потоки по всем выбранным счетам за всё время — вход для XIRR
 * на дашборде. Зеркалит useRealized/usePaymentsBreakdown (useQueries по счетам,
 * токен вне queryKey). Терминальную стоимость портфеля XIRR добавляет отдельно.
 */
export const useCashflows = (): UseCashflowsResult => {
    const { data: tbank } = useTbank();
    const token = tbank?.token;
    const accounts = tbank?.accounts ?? [];
    const to = buildTo();

    const queries = useQueries({
        queries: accounts.map((account) => ({
            queryKey: ['cashflows', account.id, ALL_TIME_FROM, to],
            queryFn: () => getCashflows(account.id, ALL_TIME_FROM, to, token as string),
            enabled: !!token,
            staleTime: 60 * 60 * 1000,
            refetchOnWindowFocus: false as const
        }))
    });

    const byAccount: Record<string, CashflowsScope> = {};
    accounts.forEach((account, i) => {
        const data = queries[i]?.data;
        byAccount[account.id] = data
            ? {
                  items: data.items ?? [],
                  hasNonRub: data.hasNonRub ?? false,
                  contributions: data.contributions ?? 0,
                  distributions: data.distributions ?? 0
              }
            : EMPTY;
    });

    const all: CashflowsScope = accounts.length
        ? {
              items: mergeItems(accounts.map((a) => byAccount[a.id].items)),
              hasNonRub: accounts.some((a) => byAccount[a.id].hasNonRub),
              contributions: round2(accounts.reduce((s, a) => s + byAccount[a.id].contributions, 0)),
              distributions: round2(accounts.reduce((s, a) => s + byAccount[a.id].distributions, 0))
          }
        : EMPTY;

    const status: CashflowsStatus = !token || accounts.length === 0
        ? 'empty'
        : queries.some((query) => query.isLoading)
          ? 'loading'
          : queries.every((query) => query.isError)
            ? 'error'
            : 'ready';

    return {
        byAccount,
        all,
        status,
        isFetching: queries.some((query) => query.isFetching)
    };
};
