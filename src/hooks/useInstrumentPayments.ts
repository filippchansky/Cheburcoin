import { useQueries } from '@tanstack/react-query';
import { getPayments } from '@api/tinkoff/getPayments/getPayments';
import { IPaymentItem } from '@models/tinkoffData';
import { useTbank } from './useTbank';

/**
 * Все прошедшие выплаты по одной бумаге (дивиденды/купоны + удержанные по ним
 * налоги и комиссии сделок) со всех подключённых счетов за всё время — для блока
 * «В портфеле» на странице акции/облигации.
 *
 * Тянет тот же endpoint и с тем же queryKey, что usePaymentsBreakdown, поэтому
 * запрос дедупится react-query (лишнего обращения к беку нет), а затем фильтрует
 * операции по инструменту (instrumentUid, с запасным ключом figi) и раскладывает
 * их по доходным категориям. Учитываем только рублёвые движения; погашения и
 * амортизация — возврат тела облигации, не доход, поэтому в суммы не идут (но
 * остаются в списке операций для полноты истории).
 */
export interface InstrumentPaymentsResult {
    /** Дивиденды до налога, ₽. */
    dividends: number;
    /** Купоны до налога, ₽. */
    coupons: number;
    /** Начисления = дивиденды + купоны (gross), ₽. */
    income: number;
    /** Удержанный налог, положительная величина, ₽. */
    taxes: number;
    /** Уплаченные комиссии по сделкам с бумагой, положительная величина, ₽. */
    fees: number;
    /** Чистые начисления = income − taxes − fees, ₽. */
    net: number;
    /** Кол-во доходных выплат (дивиденды + купоны). */
    payoutsCount: number;
    /** Операции по бумаге (рублёвые), новые → старые. */
    items: IPaymentItem[];
    /** Были нерублёвые выплаты — в рублёвые суммы не вошли. */
    hasNonRub: boolean;
    status: 'empty' | 'loading' | 'error' | 'ready';
    isFetching: boolean;
}

const RUB_CURRENCIES = new Set(['rub', 'sur', 'RUB', 'SUR']);
const isRub = (currency: string | null) => currency === null || RUB_CURRENCIES.has(currency);
const round2 = (n: number) => Number(n.toFixed(2));

// «Всё время» + стабилизированная верхняя граница — идентичны
// usePaymentsBreakdown, чтобы queryKey (а значит и кэш) совпадали.
const ALL_TIME_FROM = '2015-01-01T00:00:00.000Z';
const buildTo = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 0);
    return end.toISOString();
};

const EMPTY: InstrumentPaymentsResult = {
    dividends: 0,
    coupons: 0,
    income: 0,
    taxes: 0,
    fees: 0,
    net: 0,
    payoutsCount: 0,
    items: [],
    hasNonRub: false,
    status: 'empty',
    isFetching: false
};

/**
 * @param instrumentUid  uid бумаги из позиции портфеля (главный ключ джойна)
 * @param figi           figi той же бумаги (запасной ключ, если uid не совпал)
 * @param relatedTickers тикеры «семьи» (обычка+префы одного эмитента) — операции
 *                       по любому из них тоже учитываются в суммах бумаги
 */
export const useInstrumentPayments = (
    instrumentUid?: string | null,
    figi?: string | null,
    relatedTickers?: string[]
): InstrumentPaymentsResult => {
    const { data: tbank } = useTbank();
    const token = tbank?.token;
    const accounts = tbank?.accounts ?? [];
    const to = buildTo();

    const queries = useQueries({
        queries: accounts.map((account) => ({
            queryKey: ['payments-breakdown', account.id, ALL_TIME_FROM, to],
            queryFn: () => getPayments(account.id, ALL_TIME_FROM, to, token as string),
            enabled: !!token,
            staleTime: 60 * 60 * 1000,
            refetchOnWindowFocus: false as const
        }))
    });

    const status: InstrumentPaymentsResult['status'] = !token || accounts.length === 0
        ? 'empty'
        : queries.some((query) => query.isLoading)
          ? 'loading'
          : queries.every((query) => query.isError)
            ? 'error'
            : 'ready';

    const isFetching = queries.some((query) => query.isFetching);

    const tickerSet = new Set((relatedTickers ?? []).map((t) => t.trim().toUpperCase()));

    // Без ключа джойна суммировать нечего — отдаём пустой результат с реальным
    // статусом (блок сам решит, показываться ему или нет).
    if (!instrumentUid && !figi && tickerSet.size === 0) {
        return { ...EMPTY, status, isFetching };
    }

    const belongs = (item: IPaymentItem) =>
        (instrumentUid && item.instrumentUid === instrumentUid) ||
        (figi && item.figi === figi) ||
        (item.ticker ? tickerSet.has(item.ticker.toUpperCase()) : false);

    let dividends = 0;
    let coupons = 0;
    let taxes = 0;
    let fees = 0;
    let payoutsCount = 0;
    let hasNonRub = false;
    const items: IPaymentItem[] = [];

    queries.forEach((query) => {
        (query.data?.items ?? []).forEach((item) => {
            if (!belongs(item)) return;
            if (!isRub(item.currency)) {
                hasNonRub = true;
                return;
            }
            items.push(item);
            if (item.category === 'dividend') {
                dividends += item.payment;
                payoutsCount += 1;
            } else if (item.category === 'coupon') {
                coupons += item.payment;
                payoutsCount += 1;
            } else if (item.category === 'tax') {
                taxes += -item.payment; // payment налога < 0
            } else if (item.category === 'fee') {
                fees += -item.payment; // payment комиссии < 0
            }
        });
    });

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const income = round2(dividends + coupons);
    return {
        dividends: round2(dividends),
        coupons: round2(coupons),
        income,
        taxes: round2(taxes),
        fees: round2(fees),
        net: round2(dividends + coupons - taxes - fees),
        payoutsCount,
        items,
        hasNonRub,
        status,
        isFetching
    };
};
