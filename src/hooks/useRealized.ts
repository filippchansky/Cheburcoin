import { useQueries } from '@tanstack/react-query';
import { getRealized } from '@api/tinkoff/getRealized/getRealized';
import { useTbank } from './useTbank';

/**
 * Реализованный P/L по одному «срезу» (счёт или все счета), за всё время.
 * Сумма готовых `realized` по продажам ценных бумаг. Валютные конвертации
 * (realized=null) не учитываем — это не «доходность», а обмен валюты.
 */
export interface RealizedBreakdown {
    /** Реализованный результат по проданным бумагам, ₽. */
    realized: number;
    /** Были нерублёвые продажи — в рублёвый итог не вошли. */
    hasNonRub: boolean;
}

export type RealizedStatus = 'empty' | 'loading' | 'error' | 'ready';

export interface UseRealizedResult {
    byAccount: Record<string, RealizedBreakdown>;
    all: RealizedBreakdown;
    status: RealizedStatus;
    isFetching: boolean;
}

const RUB_CURRENCIES = new Set(['rub', 'sur', 'RUB', 'SUR']);
const isRub = (currency: string | null) => currency === null || RUB_CURRENCIES.has(currency);
const round2 = (n: number) => Number(n.toFixed(2));

// «Всё время» — как в usePaymentsBreakdown (2015-й заведомо раньше счёта).
const ALL_TIME_FROM = '2015-01-01T00:00:00.000Z';
const buildTo = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 0);
    return end.toISOString();
};

const EMPTY: RealizedBreakdown = { realized: 0, hasNonRub: false };

/**
 * Реализованный P/L по всем выбранным счетам за всё время. Зеркалит
 * usePaymentsBreakdown (useQueries по счетам, токен вне queryKey) — для строки
 * «Реализовано» в KPI «Доходность» на дашборде.
 */
export const useRealized = (): UseRealizedResult => {
    const { data: tbank } = useTbank();
    const token = tbank?.token;
    const accounts = tbank?.accounts ?? [];
    const to = buildTo();

    const queries = useQueries({
        queries: accounts.map((account) => ({
            queryKey: ['realized', account.id, ALL_TIME_FROM, to],
            queryFn: () => getRealized(account.id, ALL_TIME_FROM, to, token as string),
            enabled: !!token,
            staleTime: 60 * 60 * 1000, // история почти неизменна — 1ч
            refetchOnWindowFocus: false as const
        }))
    });

    const byAccount: Record<string, RealizedBreakdown> = {};
    accounts.forEach((account, i) => {
        const items = queries[i]?.data?.items ?? [];
        let realized = 0;
        let hasNonRub = false;
        items.forEach((item) => {
            if (item.realized === null) return; // валютная конвертация — пропускаем
            if (!isRub(item.currency)) {
                hasNonRub = true;
                return;
            }
            realized += item.realized;
        });
        byAccount[account.id] = { realized: round2(realized), hasNonRub };
    });

    const all = accounts.length
        ? Object.values(byAccount).reduce(
              (a, p) => ({
                  realized: round2(a.realized + p.realized),
                  hasNonRub: a.hasNonRub || p.hasNonRub
              }),
              EMPTY
          )
        : EMPTY;

    const status: RealizedStatus = !token || accounts.length === 0
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
