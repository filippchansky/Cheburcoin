import { IShareCandle } from '@models/shareDetail';
import { columnGetter, toNumber } from '../columnUtils';
import { fetchCandlesRaw } from '../fetchCandles';

/**
 * Свечи акции за период. `interval`: 24 = дневные, 60 = часовые, 10 = 10-минутные.
 * `begin` приходит как «YYYY-MM-DD HH:MM:SS» — берём дату.
 */
export const getShareCandles = async (
    ticker: string,
    from: string,
    interval = '24'
): Promise<IShareCandle[]> => {
    const till = new Date().toISOString().split('T')[0];
    const { columns, data } = await fetchCandlesRaw('shares', ticker, from, till, interval);

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
