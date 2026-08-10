import { IBondCandle } from '@models/bondDetail';
import { columnGetter, toNumber } from '../columnUtils';
import { fetchCandlesRaw } from '../fetchCandles';

/** Дневные свечи облигации за период (цена в % от номинала). */
export const getBondCandles = async (
    secid: string,
    from: string,
    interval = '24'
): Promise<IBondCandle[]> => {
    const till = new Date().toISOString().split('T')[0];
    const { columns, data } = await fetchCandlesRaw('bonds', secid, from, till, interval);

    const get = columnGetter(columns);
    return data.map((row) => ({
        date: (get<string>(row, 'begin') ?? '').split(' ')[0],
        close: toNumber(get(row, 'close')),
        open: toNumber(get(row, 'open')),
        high: toNumber(get(row, 'high')),
        low: toNumber(get(row, 'low'))
    }));
};
