import { getFutures } from '@api/moex/futures/getFutures';
import { getFutureCandles } from '@api/moex/futures/getFutureCandles';
import { mapFutures } from '@api/moex/futures/mapFutures';
import { IFuture, IFuturesRaw } from '@models/marketFuture';
import { useQuery } from '@tanstack/react-query';

const MINUTE = 1000 * 60;

/** Фьючерсы без цены (нет данных marketdata и расчётной) отсекаем — показывать нечего. */
const mapAllFutures = (raw: IFuturesRaw): IFuture[] =>
    mapFutures(raw).filter((future) => future.last !== null);

/**
 * По каждому базовому активу оставляет один представительный контракт: ближайший
 * неистёкший по дате исполнения, а среди равных — самый ликвидный (по обороту).
 * У активов только с вечным фьючерсом останется он. Так список не превращается в
 * «лесенку» из всех месячных серий — вся серия видна на детальной странице.
 */
export const selectNearContracts = (futures: IFuture[]): IFuture[] => {
    const today = new Date().toISOString().split('T')[0];
    const best = new Map<string, IFuture>();

    for (const future of futures) {
        const current = best.get(future.assetCode);
        if (!current) {
            best.set(future.assetCode, future);
            continue;
        }
        // Неистёкшие приоритетнее истёкших; среди неистёкших — с более ранней датой;
        // при равных датах — более ликвидный (больший оборот).
        const aLive = future.expiry >= today;
        const bLive = current.expiry >= today;
        if (aLive !== bLive) {
            if (aLive) best.set(future.assetCode, future);
        } else if (future.expiry !== current.expiry) {
            if (future.expiry < current.expiry) best.set(future.assetCode, future);
        } else if (future.valToday > current.valToday) {
            best.set(future.assetCode, future);
        }
    }

    return Array.from(best.values());
};

/**
 * Все торгуемые фьючерсы срочного рынка одним списком, с выведенной группой.
 * В торговые часы цены «живые» — обновляем раз в минуту.
 */
export const useFutures = () =>
    useQuery({
        queryKey: ['futures', 'all'],
        queryFn: getFutures,
        select: mapAllFutures,
        refetchInterval: MINUTE,
        staleTime: MINUTE
    });

/**
 * Один фьючерс по SECID — берётся из того же кэша, что и список (отдельного запроса
 * на контракт нет). Пока список грузится — undefined; загружен, но кода нет — null.
 */
export const useFuture = (secid: string) =>
    useQuery({
        queryKey: ['futures', 'all'],
        queryFn: getFutures,
        select: (raw: IFuturesRaw): IFuture | null =>
            mapAllFutures(raw).find((future) => future.secid === secid) ?? null,
        refetchInterval: MINUTE,
        staleTime: MINUTE,
        enabled: !!secid
    });

/**
 * Срочная структура актива: все контракты одного ASSETCODE, отсортированные по дате
 * исполнения (вечные — в конце). Берётся из общего кэша списка.
 */
export const useFutureTermStructure = (assetCode: string) =>
    useQuery({
        queryKey: ['futures', 'all'],
        queryFn: getFutures,
        select: (raw: IFuturesRaw): IFuture[] =>
            mapAllFutures(raw)
                .filter((future) => future.assetCode === assetCode)
                .sort((a, b) => a.expiry.localeCompare(b.expiry)),
        refetchInterval: MINUTE,
        staleTime: MINUTE,
        enabled: !!assetCode
    });

/** Свечи фьючерса за период (для графика цены). */
export const useFutureCandles = (secid: string, from: string, interval = '24') =>
    useQuery({
        queryKey: ['future-candles', secid, from, interval],
        queryFn: () => getFutureCandles(secid, from, interval),
        enabled: !!secid && !!from
    });
