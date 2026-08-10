import { useQueries } from '@tanstack/react-query';
import { getPayments } from '@api/tinkoff/getPayments/getPayments';
import { IPaymentItem } from '@models/tinkoffData';
import { useTbank } from './useTbank';

export interface MonthNet {
    /** Ключ месяца `YYYY-MM`. */
    key: string;
    label: string;
    amount: number;
}

export type PaymentsStatus = 'empty' | 'loading' | 'error' | 'ready';

export interface UsePaymentsResult {
    items: IPaymentItem[];
    byMonth: MonthNet[];
    /** Чистыми за период (приход − налог), только рублёвые. */
    totalNet: number;
    /** Приход до налога, только рублёвые. */
    totalGross: number;
    /** Удержано налога (положительное число), только рублёвые. */
    totalTax: number;
    hasNonRub: boolean;
    status: PaymentsStatus;
    isFetching: boolean;
    refetchAll: () => void;
}

const RUB_CURRENCIES = new Set(['rub', 'sur', 'RUB', 'SUR']);
const monthLabel = new Intl.DateTimeFormat('ru-RU', { month: 'short', year: 'numeric' });
const isRub = (currency: string | null) => currency === null || RUB_CURRENCIES.has(currency);
const round2 = (n: number) => Number(n.toFixed(2));

/** Окно [сегодня − months, сегодня] в RFC3339, стабилизированное до суток. */
const buildWindow = (months: number) => {
    const end = new Date();
    end.setHours(23, 59, 59, 0);
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: end.toISOString() };
};

/**
 * История прошедших выплат по всем выбранным счетам за последние `months` мес.
 * Тянет счета параллельно (useQueries), токен ВНЕ queryKey (как в usePortfolio).
 * Рублёвые суммы агрегирует; нерублёвые в итог/график не включает (флаг hasNonRub).
 */
export const usePayments = (months: number): UsePaymentsResult => {
    const { data: tbank } = useTbank();
    const token = tbank?.token;
    const accounts = tbank?.accounts ?? [];
    const { from, to } = buildWindow(months);

    const queries = useQueries({
        queries: accounts.map((account) => ({
            queryKey: ['payments', account.id, from, to],
            queryFn: () => getPayments(account.id, from, to, token as string),
            enabled: !!token,
            staleTime: 60 * 60 * 1000, // история почти неизменна — 1ч
            refetchOnWindowFocus: false as const
        }))
    });

    const items: IPaymentItem[] = queries
        .flatMap((query) => query.data?.items ?? [])
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let totalGross = 0;
    let totalTax = 0;
    let hasNonRub = false;
    const monthMap = new Map<string, MonthNet>();

    items.forEach((item) => {
        if (!isRub(item.currency)) {
            hasNonRub = true;
            return;
        }
        if (item.payment >= 0) totalGross += item.payment;
        else totalTax += -item.payment;

        const date = new Date(item.date);
        if (Number.isNaN(date.getTime())) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const prev = monthMap.get(key);
        if (prev) {
            prev.amount = round2(prev.amount + item.payment);
        } else {
            monthMap.set(key, { key, label: monthLabel.format(date), amount: round2(item.payment) });
        }
    });

    const byMonth = Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));

    const status: PaymentsStatus = !token || accounts.length === 0
        ? 'empty'
        : queries.some((query) => query.isLoading)
          ? 'loading'
          : queries.every((query) => query.isError)
            ? 'error'
            : 'ready';

    return {
        items,
        byMonth,
        totalNet: round2(totalGross - totalTax),
        totalGross: round2(totalGross),
        totalTax: round2(totalTax),
        hasNonRub,
        status,
        isFetching: queries.some((query) => query.isFetching),
        refetchAll: () => queries.forEach((query) => query.refetch())
    };
};
