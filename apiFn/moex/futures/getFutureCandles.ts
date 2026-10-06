import { columnGetter, toNumber } from '../columnUtils';
import { fetchCandlesRaw } from '../fetchCandles';

/** Свеча фьючерса. В отличие от акций/индексов, у FORTS осмыслен объём в контрактах (volume). */
export interface IFutureCandle {
    date: string;
    open: number;
    close: number;
    high: number;
    low: number;
    /** Объём за период, контрактов (колонка volume). */
    volume: number;
}

/**
 * Свечи фьючерса за период. Торгуется на рынке `forts` (движок futures), набор колонок
 * тот же, что у акций (open/close/high/low/value/volume/begin). `interval`: 24 — дневные,
 * 7 — недельные (для длинных периодов). У товарных контрактов оборот в ₽ (value) пуст,
 * поэтому вторичный ряд графика — объём в контрактах.
 */
export const getFutureCandles = async (
    secid: string,
    from: string,
    interval = '24'
): Promise<IFutureCandle[]> => {
    const till = new Date().toISOString().split('T')[0];
    const { columns, data } = await fetchCandlesRaw('forts', secid, from, till, interval);

    const col = columnGetter(columns);

    return data.map((row) => ({
        date: String(col<string>(row, 'begin') ?? '').split(' ')[0],
        open: toNumber(col(row, 'open')),
        close: toNumber(col(row, 'close')),
        high: toNumber(col(row, 'high')),
        low: toNumber(col(row, 'low')),
        volume: toNumber(col(row, 'volume'))
    }));
};
