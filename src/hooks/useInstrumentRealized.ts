import { useQueries } from '@tanstack/react-query';
import { getRealized } from '@api/tinkoff/getRealized/getRealized';
import { IRealizedItem } from '@models/tinkoffData';
import { useTbank } from './useTbank';

/**
 * Реализованный P/L по одной бумаге (прибыль/убыток от уже закрытых продаж) со
 * всех подключённых счетов за всё время — для строки «Прибыль от продаж» в блоке
 * «В портфеле». Т-Банк сам считает результат сделки и кладёт его в `realized`
 * (FIFO самим строить не нужно).
 *
 * Тот же endpoint и queryKey, что useRealized (строка «Реализовано» в KPI
 * дашборда), поэтому запрос дедупится react-query. Валютные конвертации
 * (realized=null) и нерублёвые продажи в сумму не идут.
 */
export interface InstrumentRealizedResult {
    /** Реализованный P/L по бумаге, ₽ (0, если продаж не было). */
    realized: number;
    /** Были ли по бумаге закрытые продажи (учтённые в рублях). */
    hasSales: boolean;
    /** Были нерублёвые продажи — в рублёвую сумму не вошли. */
    hasNonRub: boolean;
    /** Продажи по бумаге (рублёвые, с готовым realized), новые → старые. */
    items: IRealizedItem[];
    status: 'empty' | 'loading' | 'error' | 'ready';
    isFetching: boolean;
}

const RUB_CURRENCIES = new Set(['rub', 'sur', 'RUB', 'SUR']);
const isRub = (currency: string | null) => currency === null || RUB_CURRENCIES.has(currency);
const round2 = (n: number) => Number(n.toFixed(2));

const ALL_TIME_FROM = '2015-01-01T00:00:00.000Z';
const buildTo = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 0);
    return end.toISOString();
};

const EMPTY: InstrumentRealizedResult = {
    realized: 0,
    hasSales: false,
    hasNonRub: false,
    items: [],
    status: 'empty',
    isFetching: false
};

/**
 * @param instrumentUid  uid бумаги из позиции портфеля (главный ключ джойна)
 * @param figi           figi той же бумаги (запасной ключ)
 * @param relatedTickers тикеры «семьи» (обычка+префы) — продажи по любому из них
 *                       тоже идут в реализованный результат бумаги
 */
export const useInstrumentRealized = (
    instrumentUid?: string | null,
    figi?: string | null,
    relatedTickers?: string[]
): InstrumentRealizedResult => {
    const { data: tbank } = useTbank();
    const token = tbank?.token;
    const accounts = tbank?.accounts ?? [];
    const to = buildTo();

    const queries = useQueries({
        queries: accounts.map((account) => ({
            queryKey: ['realized', account.id, ALL_TIME_FROM, to],
            queryFn: () => getRealized(account.id, ALL_TIME_FROM, to, token as string),
            enabled: !!token,
            staleTime: 60 * 60 * 1000,
            refetchOnWindowFocus: false as const
        }))
    });

    const status: InstrumentRealizedResult['status'] = !token || accounts.length === 0
        ? 'empty'
        : queries.some((query) => query.isLoading)
          ? 'loading'
          : queries.every((query) => query.isError)
            ? 'error'
            : 'ready';

    const isFetching = queries.some((query) => query.isFetching);

    const tickerSet = new Set((relatedTickers ?? []).map((t) => t.trim().toUpperCase()));

    if (!instrumentUid && !figi && tickerSet.size === 0) {
        return { ...EMPTY, status, isFetching };
    }

    const belongs = (item: IRealizedItem) =>
        (instrumentUid && item.instrumentUid === instrumentUid) ||
        (figi && item.figi === figi) ||
        (item.ticker ? tickerSet.has(item.ticker.toUpperCase()) : false);

    let realized = 0;
    let hasNonRub = false;
    const items: IRealizedItem[] = [];

    queries.forEach((query) => {
        (query.data?.items ?? []).forEach((item) => {
            if (!belongs(item)) return;
            if (item.realized === null) return; // валютная конвертация — мимо
            if (!isRub(item.currency)) {
                hasNonRub = true;
                return;
            }
            items.push(item);
            realized += item.realized;
        });
    });

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
        realized: round2(realized),
        hasSales: items.length > 0,
        hasNonRub,
        items,
        status,
        isFetching
    };
};
