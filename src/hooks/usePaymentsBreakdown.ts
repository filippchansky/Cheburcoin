import { useQueries } from '@tanstack/react-query';
import { getPayments } from '@api/tinkoff/getPayments/getPayments';
import { useTbank } from './useTbank';

/**
 * Доходная разбивка выплат по одному «срезу» (счёт или все счета), за всё время.
 * Только доходные категории: купоны и дивиденды берём gross (налог отдельной
 * строкой). Погашения/амортизацию (`repayment`) и `other` НЕ включаем — это
 * возврат тела облигации, а не доход; их прибыль (если бумага куплена с
 * дисконтом) придёт реализованным `yield` в Этапе 2.
 */
export interface PaymentsBreakdown {
    /** Купоны до налога, ₽. */
    coupons: number;
    /** Дивиденды до налога (вкл. выплаченные на карту, DIV_EXT), ₽. */
    dividends: number;
    /** Удержанный налог, положительная величина, ₽. */
    taxes: number;
    /** Уплаченные комиссии (брокерская/депозитарная/…), положительная величина, ₽. */
    fees: number;
    /** Чистый доход от выплат = coupons + dividends − taxes − fees, ₽. */
    net: number;
    /** Были нерублёвые выплаты — в рублёвый итог не вошли. */
    hasNonRub: boolean;
}

export type BreakdownStatus = 'empty' | 'loading' | 'error' | 'ready';

export interface UsePaymentsBreakdownResult {
    /** Разбивка по каждому счёту (ключ — accountId). */
    byAccount: Record<string, PaymentsBreakdown>;
    /** Сводная разбивка по всем выбранным счетам. */
    all: PaymentsBreakdown;
    status: BreakdownStatus;
    isFetching: boolean;
}

const RUB_CURRENCIES = new Set(['rub', 'sur', 'RUB', 'SUR']);
const isRub = (currency: string | null) => currency === null || RUB_CURRENCIES.has(currency);
const round2 = (n: number) => Number(n.toFixed(2));

// «Всё время»: T-Invest API начался в 2018-м, счета ещё позже — 2015-й заведомо
// раньше любой операции. Верхнюю границу стабилизируем до конца суток, чтобы
// queryKey не менялся каждый рендер (кэш держится).
const ALL_TIME_FROM = '2015-01-01T00:00:00.000Z';
const buildTo = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 0);
    return end.toISOString();
};

const EMPTY: PaymentsBreakdown = { coupons: 0, dividends: 0, taxes: 0, fees: 0, net: 0, hasNonRub: false };

/** Свод разбивок (для агрегата «все счета»). */
const merge = (parts: PaymentsBreakdown[]): PaymentsBreakdown => {
    const acc = parts.reduce(
        (a, p) => ({
            coupons: a.coupons + p.coupons,
            dividends: a.dividends + p.dividends,
            taxes: a.taxes + p.taxes,
            fees: a.fees + p.fees,
            hasNonRub: a.hasNonRub || p.hasNonRub
        }),
        { coupons: 0, dividends: 0, taxes: 0, fees: 0, hasNonRub: false }
    );
    return {
        coupons: round2(acc.coupons),
        dividends: round2(acc.dividends),
        taxes: round2(acc.taxes),
        fees: round2(acc.fees),
        net: round2(acc.coupons + acc.dividends - acc.taxes - acc.fees),
        hasNonRub: acc.hasNonRub
    };
};

/**
 * Доходная разбивка полученных выплат по всем выбранным счетам за всё время.
 * Зеркалит usePayments (useQueries по счетам, токен вне queryKey), но считает
 * не скользящее окно, а полную историю и раскладывает по доходным категориям —
 * для KPI «Доходность с учётом выплат» на дашборде.
 */
export const usePaymentsBreakdown = (): UsePaymentsBreakdownResult => {
    const { data: tbank } = useTbank();
    const token = tbank?.token;
    const accounts = tbank?.accounts ?? [];
    const to = buildTo();

    const queries = useQueries({
        queries: accounts.map((account) => ({
            queryKey: ['payments-breakdown', account.id, ALL_TIME_FROM, to],
            queryFn: () => getPayments(account.id, ALL_TIME_FROM, to, token as string),
            enabled: !!token,
            staleTime: 60 * 60 * 1000, // история почти неизменна — 1ч
            refetchOnWindowFocus: false as const
        }))
    });

    const byAccount: Record<string, PaymentsBreakdown> = {};
    accounts.forEach((account, i) => {
        const items = queries[i]?.data?.items ?? [];
        let coupons = 0;
        let dividends = 0;
        let taxes = 0;
        let fees = 0;
        let hasNonRub = false;
        items.forEach((item) => {
            if (!isRub(item.currency)) {
                hasNonRub = true;
                return;
            }
            if (item.category === 'coupon') coupons += item.payment;
            else if (item.category === 'dividend') dividends += item.payment;
            else if (item.category === 'tax') taxes += -item.payment; // payment налога < 0
            else if (item.category === 'fee') fees += -item.payment; // payment комиссии < 0
        });
        byAccount[account.id] = {
            coupons: round2(coupons),
            dividends: round2(dividends),
            taxes: round2(taxes),
            fees: round2(fees),
            net: round2(coupons + dividends - taxes - fees),
            hasNonRub
        };
    });

    const all = accounts.length ? merge(Object.values(byAccount)) : EMPTY;

    const status: BreakdownStatus = !token || accounts.length === 0
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
