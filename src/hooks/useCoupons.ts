import { useQuery } from '@tanstack/react-query';
import { getCoupons } from '@api/tinkoff/getCoupons/getCoupons';
import { ICouponEvent, IPosition } from '@models/tinkoffData';
import { useTbank } from './useTbank';

/** Купонное событие, обогащённое тикером/именем из позиции портфеля. */
export interface EnrichedCoupon extends ICouponEvent {
    ticker?: string;
    name?: string;
    isin?: string;
}

export interface MonthBucket {
    /** Ключ месяца `YYYY-MM` (для сортировки/оси графика). */
    key: string;
    /** Человекочитаемая метка: «авг 2026». */
    label: string;
    amount: number;
}

export type CouponsStatus = 'empty' | 'loading' | 'error' | 'ready';

export interface UseCouponsResult {
    events: EnrichedCoupon[];
    byMonth: MonthBucket[];
    /** Сумма купонов за окно (только рублёвые), ДО налога. */
    total12m: number;
    /** Есть ли нерублёвые купоны (в итог не вошли — моновалютность фронта). */
    hasNonRub: boolean;
    status: CouponsStatus;
    isFetching: boolean;
    refetch: () => void;
}

const MONTHS = 12;
const RUB_CURRENCIES = new Set(['rub', 'sur', 'RUB', 'SUR']);
const monthLabel = new Intl.DateTimeFormat('ru-RU', { month: 'short', year: 'numeric' });

const isRub = (currency: string | null) => currency === null || RUB_CURRENCIES.has(currency);

/** Окно [сегодня, +12 мес] в RFC3339. Дата запроса стабилизирована до суток — иначе queryKey «плыл» бы каждую секунду. */
const buildWindow = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + MONTHS);
    return { from: start.toISOString(), to: end.toISOString() };
};

/**
 * Календарь будущих купонов по переданным облигационным позициям (обычно —
 * агрегат по всем счетам). Токен НЕ входит в queryKey (как в usePortfolio):
 * расписание зависит от набора бумаг и окна дат, а не от токена.
 */
export const useCoupons = (bondPositions: IPosition[]): UseCouponsResult => {
    const { data: tbank } = useTbank();
    const token = tbank?.token;

    const bonds = bondPositions
        .filter((p) => p.instrumentUid && (p.quantity ?? 0) > 0)
        .map((p) => ({ instrumentId: p.instrumentUid, quantity: p.quantity }));

    // Джойн тикера/имени по instrumentUid (бек их не резолвит — экономим N+1).
    const metaByUid = new Map(bondPositions.map((p) => [p.instrumentUid, p]));

    const { from, to } = buildWindow();
    // Сигнатура набора бумаг — стабильный ключ независимо от порядка.
    const signature = bonds
        .map((b) => `${b.instrumentId}:${b.quantity}`)
        .sort()
        .join(',');

    const query = useQuery({
        queryKey: ['coupons', signature, from],
        queryFn: () => getCoupons(bonds, from, to, token as string),
        enabled: !!token && bonds.length > 0,
        staleTime: 12 * 60 * 60 * 1000, // расписание меняется редко — 12ч
        refetchOnWindowFocus: false
    });

    const rawEvents = query.data?.events ?? [];

    const events: EnrichedCoupon[] = rawEvents.map((event) => {
        const meta = metaByUid.get(event.instrumentId);
        return { ...event, ticker: meta?.ticker, name: meta?.name, isin: meta?.isin };
    });

    const total12m = events.reduce(
        (sum, event) => (isRub(event.currency) ? sum + event.amount : sum),
        0
    );
    const hasNonRub = events.some((event) => !isRub(event.currency));

    const monthMap = new Map<string, MonthBucket>();
    events.forEach((event) => {
        if (!isRub(event.currency)) return;
        const date = new Date(event.couponDate);
        if (Number.isNaN(date.getTime())) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const prev = monthMap.get(key);
        if (prev) {
            prev.amount = Number((prev.amount + event.amount).toFixed(2));
        } else {
            monthMap.set(key, {
                key,
                label: monthLabel.format(date),
                amount: Number(event.amount.toFixed(2))
            });
        }
    });
    const byMonth = Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));

    const status: CouponsStatus =
        !token || bonds.length === 0
            ? 'empty'
            : query.isLoading
              ? 'loading'
              : query.isError
                ? 'error'
                : 'ready';

    return {
        events,
        byMonth,
        total12m: Number(total12m.toFixed(2)),
        hasNonRub,
        status,
        isFetching: query.isFetching,
        refetch: () => query.refetch()
    };
};
