import { columnGetter, toNumber } from '../columnUtils';
import { fetchCandlesRaw } from '../fetchCandles';

/** Свеча индекса. У индексов volume=0, поэтому вторичный ряд графика — оборот (value, ₽). */
export interface IIndexCandle {
    date: string;
    open: number;
    close: number;
    high: number;
    low: number;
    /** Оборот бумаг индекса за период, ₽ (колонка value). */
    value: number;
}

/**
 * Свечи индекса за период. Индексы торгуются на рынке `index`, набор колонок тот же,
 * что у акций (open/close/high/low/value/volume/begin). `interval`: 24 — дневные, 7 —
 * недельные (для длинных периодов).
 */
export const getIndexCandles = async (
    secid: string,
    from: string,
    interval = '24'
): Promise<IIndexCandle[]> => {
    const till = new Date().toISOString().split('T')[0];
    const { columns, data } = await fetchCandlesRaw('index', secid, from, till, interval);

    const col = columnGetter(columns);

    return data.map((row) => ({
        date: String(col<string>(row, 'begin') ?? '').split(' ')[0],
        open: toNumber(col(row, 'open')),
        close: toNumber(col(row, 'close')),
        high: toNumber(col(row, 'high')),
        low: toNumber(col(row, 'low')),
        value: toNumber(col(row, 'value'))
    }));
};
