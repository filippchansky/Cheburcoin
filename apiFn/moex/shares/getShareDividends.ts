import { IShareDividend } from '@models/shareDetail';
import { columnGetter, toNumber } from '../columnUtils';
import { apiMoex } from '../instance';

interface DividendsResponse {
    dividends: {
        columns: string[];
        data: unknown[][];
    };
}

/**
 * История дивидендов бумаги `/iss/securities/{ticker}/dividends`.
 * Отсортировано по дате отсечки убыв. (свежие сверху).
 */
export const getShareDividends = async (ticker: string): Promise<IShareDividend[]> => {
    const { data } = await apiMoex.get<DividendsResponse>(
        `iss/securities/${ticker}/dividends.json?iss.meta=off`
    );

    const col = columnGetter(data.dividends?.columns ?? []);

    return (data.dividends?.data ?? [])
        .map((row) => ({
            date: col<string>(row, 'registryclosedate'),
            value: toNumber(col(row, 'value')),
            currency: col<string>(row, 'currencyid') ?? 'RUB'
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
};
