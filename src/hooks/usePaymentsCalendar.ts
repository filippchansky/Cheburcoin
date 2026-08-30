import { useQuery } from '@tanstack/react-query';
import { getCoupons } from '@api/tinkoff/getCoupons/getCoupons';
import { getDividends } from '@api/tinkoff/getDividends/getDividends';
import { IDividendEvent, IPosition } from '@models/tinkoffData';
import { useCbrRates } from './useMarketOverview';
import { useTbank } from './useTbank';

/** Тип события календаря выплат. */
export type CalendarKind = 'coupon' | 'dividend';

/** Унифицированное будущее событие выплаты (купон или дивиденд) для общей таблицы. */
export interface CalendarEvent {
    /** Стабильный ключ строки. */
    id: string;
    kind: CalendarKind;
    /** true — прогноз по прошлым выплатам эмитента (не объявлен официально). */
    projected: boolean;
    /** instrumentUid бумаги — джойн с позицией. */
    instrumentId: string;
    /** Дата выплаты (ISO): couponDate у купона, paymentDate у дивиденда. */
    date: string;
    /** Дата отсечки реестра (ISO) — может отсутствовать. */
    fixDate: string | null;
    quantity: number;
    /** Сумма выплаты по позиции (ДО налога у купонов; объявленная/прогнозная у дивидендов). */
    amount: number;
    currency: string | null;
    /**
     * Рублёвый эквивалент суммы: для рублёвых выплат == amount; для валютных —
     * пересчёт по курсу ЦБ. 0, если курс валюты неизвестен (в итог не входит).
     */
    amountRub: number;
    /** Выплата на одну бумагу: купон на облигацию / дивиденд на акцию (в валюте выплаты). */
    amountPerUnit: number;
    /** Текущая цена бумаги в её валюте — база «доходности» выплаты. */
    price: number | null;
    /** Средняя цена позиции в её валюте — база «к средней». */
    avgPrice: number | null;
    /**
     * Периодичность выплат по бумаге, дн (медиана разрывов между её событиями в
     * окне). null — по одному событию период не определить.
     */
    periodDays: number | null;
    ticker?: string;
    name?: string;
    isin?: string;
}

/** Помесячная корзина с разбивкой по типу (для стека на графике). */
export interface CalendarMonthBucket {
    key: string;
    label: string;
    coupon: number;
    /** Объявленные (подтверждённые) дивиденды. */
    dividend: number;
    /** Прогнозные дивиденды по истории. */
    dividendProjected: number;
}

export type CalendarStatus = 'empty' | 'loading' | 'error' | 'ready';

export interface UsePaymentsCalendarResult {
    events: CalendarEvent[];
    byMonth: CalendarMonthBucket[];
    /** Итог купонов за окно (рублёвые, до налога). */
    couponTotal: number;
    /** Итог объявленных дивидендов за окно (рублёвые). */
    dividendTotal: number;
    /** Итог прогнозных дивидендов за окно (рублёвые). */
    dividendProjectedTotal: number;
    /**
     * Рублёвая стоимость платящих бумаг (облигации + акции/фонды) — база для
     * «доходности выплатами, % годовых». Валютные позиции пересчитаны по курсу ЦБ.
     */
    payingValue: number;
    /**
     * Рублёвая стоимость позиции по instrumentUid — чтобы сузить базу до бумаг,
     * реально дающих выплаты в окне (чекбокс «только по платящим»). Валютные
     * позиции пересчитаны по курсу ЦБ.
     */
    payingValueByUid: Map<string, number>;
    /**
     * Рублёвая СЕБЕСТОИМОСТЬ платящих бумаг (средняя цена × количество) — база для
     * «доходности на вложенное» (yield on cost). Валютные позиции по курсу ЦБ.
     */
    costValue: number;
    /** Есть валютные выплаты, пересчитанные в рубли по курсу ЦБ. */
    hasNonRub: boolean;
    /** Есть валютные выплаты, курс которых неизвестен — они не вошли в итог. */
    hasUnconvertible: boolean;
    /** Дата курса ЦБ, по которому пересчитаны валютные выплаты. */
    ratesDate: string | null;
    status: CalendarStatus;
    isFetching: boolean;
    refetch: () => void;
}

const MONTHS = 12;
const RUB_CURRENCIES = new Set(['rub', 'sur', 'RUB', 'SUR']);
const monthLabel = new Intl.DateTimeFormat('ru-RU', { month: 'short', year: 'numeric' });
const DAY = 24 * 60 * 60 * 1000;
/** Окно, в пределах которого объявленная выплата «перекрывает» прогнозную (антидубль). */
const DEDUP_DAYS = 45;

const isRub = (currency: string | null) => currency === null || RUB_CURRENCIES.has(currency);
const round2 = (n: number) => Number(n.toFixed(2));
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
/** Та же дата + 1 год (по компонентам — корректно для 29 февраля/високосных). */
const plusOneYear = (iso: string) => {
    const d = new Date(iso);
    return new Date(d.getFullYear() + 1, d.getMonth(), d.getDate());
};

/** Типичные периоды выплат (дн) — к ним подтягиваем измеренный разрыв. */
const COMMON_PERIODS = [7, 14, 30, 91, 182, 365];

/**
 * Проставляет periodDays: по каждой бумаге берём медиану разрывов между её
 * событиями и подтягиваем к типичному периоду (31 → 30, 92 → 91). Так частоту
 * получаем из самого расписания, без доп. поля от бека.
 */
const fillPeriods = (events: CalendarEvent[]) => {
    const byInstrument = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
        const key = `${event.instrumentId}:${event.kind}`;
        const list = byInstrument.get(key);
        if (list) list.push(event);
        else byInstrument.set(key, [event]);
    });
    byInstrument.forEach((list) => {
        if (list.length < 2) return;
        const ms = list
            .map((event) => new Date(event.date).getTime())
            .filter((v) => !Number.isNaN(v))
            .sort((a, b) => a - b);
        const gaps = ms
            .slice(1)
            .map((v, i) => Math.round((v - ms[i]) / DAY))
            .filter((g) => g > 0)
            .sort((a, b) => a - b);
        if (!gaps.length) return;
        const median = gaps[Math.floor(gaps.length / 2)];
        const period = COMMON_PERIODS.find((p) => Math.abs(p - median) <= 2) ?? median;
        list.forEach((event) => {
            event.periodDays = period;
        });
    });
};

const buildWindow = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + MONTHS);
    // Историю дивидендов тянем на ~13 мес назад: последние 12 мес фактических
    // выплат — база для прогноза «как в прошлом году» (запас на сдвиг
    // recordDate → paymentDate).
    const divFrom = new Date(start);
    divFrom.setMonth(divFrom.getMonth() - 13);
    // Нижняя граница базы прогноза — ровно 12 мес назад по дате выплаты.
    const baseFrom = new Date(start);
    baseFrom.setFullYear(baseFrom.getFullYear() - 1);
    return {
        from: start.toISOString(),
        to: end.toISOString(),
        divFrom: divFrom.toISOString(),
        startMs: start.getTime(),
        endMs: end.getTime(),
        baseFromMs: baseFrom.getTime()
    };
};

/**
 * Объединённый календарь будущих выплат: купоны (по облигациям) + дивиденды (по
 * акциям) — объявленные + прогноз по прошлым выплатам эмитента. Токен ВНЕ
 * queryKey (как в usePortfolio): расписание зависит от набора бумаг и окна.
 */
export const usePaymentsCalendar = (
    bondPositions: IPosition[],
    sharePositions: IPosition[]
): UsePaymentsCalendarResult => {
    const { data: tbank } = useTbank();
    const token = tbank?.token;
    const { data: cbr } = useCbrRates();

    // Рублёвый эквивалент суммы по курсу ЦБ. Рубли — как есть; валюта с известным
    // курсом — пересчёт; неизвестная валюта — 0 (в итог не входит, но помечается).
    const toRub = (amount: number, currency: string | null): number => {
        if (isRub(currency)) return round2(amount);
        const rate = cbr?.rates?.[currency!.toUpperCase()];
        return rate ? round2(amount * rate) : 0;
    };

    const bonds = bondPositions
        .filter((p) => p.instrumentUid && (p.quantity ?? 0) > 0)
        .map((p) => ({ instrumentId: p.instrumentUid, quantity: p.quantity }));
    const shares = sharePositions
        .filter((p) => p.instrumentUid && (p.quantity ?? 0) > 0)
        .map((p) => ({ instrumentId: p.instrumentUid, quantity: p.quantity }));

    // База «доходности выплатами»: рублёвая стоимость платящих бумаг по instrumentUid.
    // priceInPorfolio у Т-Банка — в родной валюте, приводим к рублю тем же курсом ЦБ,
    // что и сами выплаты; неизвестный курс → 0 (позиция выпадает из базы).
    const payingValueByUid = new Map<string, number>();
    [...bondPositions, ...sharePositions].forEach((p) => {
        if (!p.instrumentUid) return;
        const rub = toRub(p.priceInPorfolio ?? 0, p.currency);
        payingValueByUid.set(p.instrumentUid, round2((payingValueByUid.get(p.instrumentUid) ?? 0) + rub));
    });
    const payingValue = round2(
        Array.from(payingValueByUid.values()).reduce((sum, v) => sum + v, 0)
    );

    // Себестоимость платящих бумаг: средняя цена × количество (в родной валюте
    // позиции), приведённая к рублю тем же курсом ЦБ. База для yield on cost.
    const costValueByUid = new Map<string, number>();
    [...bondPositions, ...sharePositions].forEach((p) => {
        if (!p.instrumentUid) return;
        const costNative = (p.averagePositionPrice ?? 0) * (p.quantity ?? 0);
        const rub = toRub(costNative, p.currency);
        costValueByUid.set(p.instrumentUid, round2((costValueByUid.get(p.instrumentUid) ?? 0) + rub));
    });
    const costValue = round2(Array.from(costValueByUid.values()).reduce((sum, v) => sum + v, 0));

    // Джойн тикера/имени по instrumentUid (бек их не резолвит — экономим N+1).
    const metaByUid = new Map(
        [...bondPositions, ...sharePositions].map((p) => [p.instrumentUid, p])
    );

    const { from, to, divFrom, startMs, endMs, baseFromMs } = buildWindow();

    const bondSig = bonds.map((b) => `${b.instrumentId}:${b.quantity}`).sort().join(',');
    const shareSig = shares.map((s) => `${s.instrumentId}:${s.quantity}`).sort().join(',');

    const couponsQuery = useQuery({
        queryKey: ['coupons', bondSig, from],
        queryFn: () => getCoupons(bonds, from, to, token as string),
        enabled: !!token && bonds.length > 0,
        staleTime: 12 * 60 * 60 * 1000,
        refetchOnWindowFocus: false
    });

    const dividendsQuery = useQuery({
        queryKey: ['dividends', shareSig, from],
        queryFn: () => getDividends(shares, divFrom, to, token as string),
        enabled: !!token && shares.length > 0,
        staleTime: 12 * 60 * 60 * 1000,
        refetchOnWindowFocus: false
    });

    const enrich = (instrumentId: string) => {
        const meta = metaByUid.get(instrumentId);
        return {
            ticker: meta?.ticker,
            name: meta?.name,
            isin: meta?.isin,
            price: meta?.currentPrice ?? null,
            avgPrice: meta?.averagePositionPrice ?? null
        };
    };

    // --- Купоны ---
    const couponEvents: CalendarEvent[] = (couponsQuery.data?.events ?? []).map((event) => ({
        id: `coupon-${event.instrumentId}-${event.couponNumber}-${event.couponDate}`,
        kind: 'coupon',
        projected: false,
        instrumentId: event.instrumentId,
        date: event.couponDate,
        fixDate: event.fixDate ?? null,
        quantity: event.quantity,
        amount: event.amount,
        amountPerUnit: event.amountPerBond,
        periodDays: null,
        currency: event.currency,
        amountRub: toRub(event.amount, event.currency),
        ...enrich(event.instrumentId)
    }));

    // --- Дивиденды: делим сырьё на объявленные будущие и прошлые (база прогноза) ---
    const rawDividends = dividendsQuery.data?.events ?? [];
    const confirmedRaw: IDividendEvent[] = [];
    const pastRaw: IDividendEvent[] = [];
    rawDividends.forEach((event) => {
        const ms = new Date(event.paymentDate).getTime();
        if (Number.isNaN(ms)) return;
        if (ms >= startMs) confirmedRaw.push(event);
        else if (ms >= baseFromMs) pastRaw.push(event);
    });

    const confirmedEvents: CalendarEvent[] = confirmedRaw.map((event) => ({
        id: `dividend-${event.instrumentId}-${event.paymentDate}`,
        kind: 'dividend',
        projected: false,
        instrumentId: event.instrumentId,
        date: event.paymentDate,
        fixDate: event.recordDate ?? null,
        quantity: event.quantity,
        amount: event.amount,
        amountPerUnit: event.amountPerShare,
        periodDays: null,
        currency: event.currency,
        amountRub: toRub(event.amount, event.currency),
        ...enrich(event.instrumentId)
    }));

    // Индекс дат объявленных выплат по инструменту — чтобы прогноз их не дублировал.
    const confirmedMsByUid = new Map<string, number[]>();
    confirmedRaw.forEach((event) => {
        const arr = confirmedMsByUid.get(event.instrumentId) ?? [];
        arr.push(new Date(event.paymentDate).getTime());
        confirmedMsByUid.set(event.instrumentId, arr);
    });

    // --- Прогноз: каждую выплату за последний год проецируем на +1 год ---
    const projectedEvents: CalendarEvent[] = [];
    pastRaw.forEach((event) => {
        const projDate = plusOneYear(event.paymentDate);
        const projMs = projDate.getTime();
        if (projMs < startMs || projMs > endMs) return;
        // Антидубль: если по этой бумаге рядом уже есть объявленная выплата.
        const near = (confirmedMsByUid.get(event.instrumentId) ?? []).some(
            (ms) => Math.abs(ms - projMs) <= DEDUP_DAYS * DAY
        );
        if (near) return;
        const projFix = event.recordDate ? plusOneYear(event.recordDate).toISOString() : null;
        projectedEvents.push({
            id: `divfc-${event.instrumentId}-${projDate.toISOString().slice(0, 10)}`,
            kind: 'dividend',
            projected: true,
            instrumentId: event.instrumentId,
            date: projDate.toISOString(),
            fixDate: projFix,
            quantity: event.quantity,
            // «Как в прошлом году»: сумма = прошлая выплата (на акцию × текущее кол-во).
            amount: event.amount,
            amountPerUnit: event.amountPerShare,
            periodDays: null,
            currency: event.currency,
            amountRub: toRub(event.amount, event.currency),
            ...enrich(event.instrumentId)
        });
    });

    const events = [...couponEvents, ...confirmedEvents, ...projectedEvents].sort((a, b) =>
        a.date.localeCompare(b.date)
    );
    fillPeriods(events);

    // --- Агрегаты ---
    let couponTotal = 0;
    let dividendTotal = 0;
    let dividendProjectedTotal = 0;
    let hasNonRub = false;
    let hasUnconvertible = false;
    const monthMap = new Map<string, CalendarMonthBucket>();

    events.forEach((event) => {
        const foreign = !isRub(event.currency);
        if (foreign) {
            // Валюту с известным курсом считаем пересчитанной; без курса —
            // помечаем как «не вошло» и в рублёвый итог не берём.
            if (event.amountRub > 0) hasNonRub = true;
            else {
                hasUnconvertible = true;
                return;
            }
        }
        const date = new Date(event.date);
        if (Number.isNaN(date.getTime())) return;

        const rub = event.amountRub;
        if (event.kind === 'coupon') couponTotal += rub;
        else if (event.projected) dividendProjectedTotal += rub;
        else dividendTotal += rub;

        const key = monthKey(date);
        const bucket = monthMap.get(key) ?? {
            key,
            label: monthLabel.format(date),
            coupon: 0,
            dividend: 0,
            dividendProjected: 0
        };
        const field =
            event.kind === 'coupon' ? 'coupon' : event.projected ? 'dividendProjected' : 'dividend';
        bucket[field] = round2(bucket[field] + rub);
        monthMap.set(key, bucket);
    });

    const byMonth = Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));

    const active = [
        bonds.length > 0 ? couponsQuery : null,
        shares.length > 0 ? dividendsQuery : null
    ].filter(Boolean) as (typeof couponsQuery)[];

    const status: CalendarStatus =
        !token || active.length === 0
            ? 'empty'
            : active.some((q) => q.isLoading)
              ? 'loading'
              : active.every((q) => q.isError)
                ? 'error'
                : 'ready';

    return {
        events,
        byMonth,
        couponTotal: round2(couponTotal),
        dividendTotal: round2(dividendTotal),
        dividendProjectedTotal: round2(dividendProjectedTotal),
        payingValue,
        payingValueByUid,
        costValue,
        hasNonRub,
        hasUnconvertible,
        ratesDate: cbr?.date ?? null,
        status,
        isFetching: active.some((q) => q.isFetching),
        refetch: () => active.forEach((q) => q.refetch())
    };
};
