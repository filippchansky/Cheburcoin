import { IBondCandle } from '@models/bondDetail';
import { columnGetter, toNumber } from '../columnUtils';
import { apiMoex } from '../instance';

interface CandlesRaw {
    candles: { columns: string[]; data: unknown[][] };
}

/** Дневные свечи облигации за период (цена в % от номинала). */
export const getBondCandles = async (
    secid: string,
    from: string,
    interval = '24'
): Promise<IBondCandle[]> => {
    const till = new Date().toISOString().split('T')[0];
    const { data } = await apiMoex.get<CandlesRaw>(
        `iss/engines/stock/markets/bonds/securities/${secid}/candles.json?from=${from}&till=${till}&interval=${interval}&iss.meta=off`
    );

    const get = columnGetter(data.candles.columns);
    return data.candles.data.map((row) => ({
        date: (get<string>(row, 'begin') ?? '').split(' ')[0],
        close: toNumber(get(row, 'close')),
        open: toNumber(get(row, 'open')),
        high: toNumber(get(row, 'high')),
        low: toNumber(get(row, 'low'))
    }));
};
