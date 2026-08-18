import { useQueries } from '@tanstack/react-query';
import { getPayments } from '@api/tinkoff/getPayments/getPayments';
import { getRealized } from '@api/tinkoff/getRealized/getRealized';
import { usePortfolio } from './usePortfolio';
import { usePreferredTickers } from './useShares';
import { useTbank } from './useTbank';

/**
 * «Прибавка» к курсовой доходности по каждой позиции для колонки «Прибыль» в
 * таблице портфеля: реализованный P/L по проданным лотам + чистые начисления
 * (дивиденды/купоны − налог − комиссии), с учётом связки обычка↔префы одного
 * эмитента (SBER↔SBERP). Возвращает карту `instrumentUid → ₽`; полная прибыль
 * строки = expectedYieldFifo позиции + это значение.
 *
 * Тянет те же endpoints и queryKey, что useInstrumentPayments/useInstrumentRealized
 * и usePaymentsBreakdown/useRealized, поэтому запросы дедупятся react-query —
 * повторных обращений к беку нет. Считает всё разом по всем счетам (как на
 * странице бумаги), чтобы цифра в колонке совпадала с «Прибыль» на странице.
 */
export interface PositionsProfitResult {
    /** instrumentUid → (реализованный + начисления нетто), ₽. */
    extraByUid: Map<string, number>;
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

const up = (v?: string | null) => (v ?? '').trim().toUpperCase();
const bump = (map: Map<string, number>, key: string, delta: number) =>
    map.set(key, (map.get(key) ?? 0) + delta);

export const usePositionsProfit = (): PositionsProfitResult => {
    const { data: tbank } = useTbank();
    const token = tbank?.token;
    const accounts = tbank?.accounts ?? [];
    const to = buildTo();
    const { aggregate } = usePortfolio();
    const { data: preferredSet } = usePreferredTickers();

    const paymentQueries = useQueries({
        queries: accounts.map((account) => ({
            queryKey: ['payments-breakdown', account.id, ALL_TIME_FROM, to],
            queryFn: () => getPayments(account.id, ALL_TIME_FROM, to, token as string),
            enabled: !!token,
            staleTime: 60 * 60 * 1000,
            refetchOnWindowFocus: false as const
        }))
    });

    const realizedQueries = useQueries({
        queries: accounts.map((account) => ({
            queryKey: ['realized', account.id, ALL_TIME_FROM, to],
            queryFn: () => getRealized(account.id, ALL_TIME_FROM, to, token as string),
            enabled: !!token,
            staleTime: 60 * 60 * 1000,
            refetchOnWindowFocus: false as const
        }))
    });

    // Начисления нетто и реализованный P/L, сгруппированные по тикеру (для семьи).
    // Операции без тикера (старый кэш до правки бека) кладём в запасные карты по
    // instrumentUid/figi, чтобы не потерять и не задвоить с тикерными.
    const netByTicker = new Map<string, number>();
    const netByKeyNoTicker = new Map<string, number>();
    const realizedByTicker = new Map<string, number>();
    const realizedByKeyNoTicker = new Map<string, number>();

    paymentQueries.forEach((query) => {
        (query.data?.items ?? []).forEach((item) => {
            if (!isRub(item.currency)) return;
            let delta = 0;
            if (item.category === 'dividend' || item.category === 'coupon') delta = item.payment;
            else if (item.category === 'tax' || item.category === 'fee') delta = item.payment; // < 0
            else return;
            const ticker = up(item.ticker);
            if (ticker) bump(netByTicker, ticker, delta);
            else {
                const key = item.instrumentUid ?? item.figi;
                if (key) bump(netByKeyNoTicker, key, delta);
            }
        });
    });

    realizedQueries.forEach((query) => {
        (query.data?.items ?? []).forEach((item) => {
            if (item.realized === null) return; // валютная конвертация
            if (!isRub(item.currency)) return;
            const ticker = up(item.ticker);
            if (ticker) bump(realizedByTicker, ticker, item.realized);
            else {
                const key = item.instrumentUid ?? item.figi;
                if (key) bump(realizedByKeyNoTicker, key, item.realized);
            }
        });
    });

    // Парный тикер (обычка/преф) по конвенции MOEX: у префа срезаем хвостовую «P»,
    // у обычки приписываем. «P» срезаем только у подтверждённых префов (SECTYPE=2),
    // поэтому обычка вроде GAZP в чужую бумагу не свернётся.
    const siblingOf = (ticker: string, instrumentType: string): string => {
        if (instrumentType !== 'share' || !ticker) return '';
        if (preferredSet?.has(ticker)) return ticker.endsWith('P') && ticker.length > 1 ? ticker.slice(0, -1) : '';
        return `${ticker}P`;
    };

    const extraByUid = new Map<string, number>();
    (aggregate?.positions ?? []).forEach((position) => {
        const uid = position.instrumentUid;
        if (!uid) return;
        const own = up(position.ticker);
        const sibling = siblingOf(own, position.instrumentType);
        let extra = 0;
        [own, sibling].filter(Boolean).forEach((ticker) => {
            extra += netByTicker.get(ticker) ?? 0;
            extra += realizedByTicker.get(ticker) ?? 0;
        });
        // Запасные (безтикерные) операции — по uid и figi позиции.
        [uid, position.figi].filter(Boolean).forEach((key) => {
            extra += netByKeyNoTicker.get(key as string) ?? 0;
            extra += realizedByKeyNoTicker.get(key as string) ?? 0;
        });
        extraByUid.set(uid, round2(extra));
    });

    const queries = [...paymentQueries, ...realizedQueries];
    const status: PositionsProfitResult['status'] = !token || accounts.length === 0
        ? 'empty'
        : queries.some((query) => query.isLoading)
          ? 'loading'
          : queries.every((query) => query.isError)
            ? 'error'
            : 'ready';

    return {
        extraByUid,
        status,
        isFetching: queries.some((query) => query.isFetching)
    };
};
