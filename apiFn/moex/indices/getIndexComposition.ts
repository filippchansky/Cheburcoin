import { IIndexConstituent } from '@models/marketIndex';
import { columnGetter, toNumber } from '../columnUtils';
import { apiMoex } from '../instance';

interface AnalyticsResponse {
    analytics: {
        columns: string[];
        data: unknown[][];
    };
}

/**
 * Состав индекса: бумаги и их веса на последнюю дату пересмотра. Тот же статистический
 * эндпоинт, что питает карту рынка на главной, только параметризованный по индексу —
 * работает для акционерных (IMOEX, отраслевые) и облигационных (RGBI и т.п.). Для
 * ставок денежного рынка (РЕПО) вернётся пустой список — состава у них нет.
 * PAGESIZE ISS=20 → limit=100 покрывает даже широкие индексы.
 */
export const getIndexComposition = async (secid: string): Promise<IIndexConstituent[]> => {
    const { data } = await apiMoex.get<AnalyticsResponse>(
        `iss/statistics/engines/stock/markets/index/analytics/${secid}.json?iss.meta=off&limit=100`
    );

    const col = columnGetter(data.analytics?.columns ?? []);

    return (data.analytics?.data ?? [])
        .map((row) => ({
            ticker: col<string>(row, 'ticker'),
            name: col<string>(row, 'shortnames') ?? col<string>(row, 'ticker'),
            weight: toNumber(col(row, 'weight'))
        }))
        .sort((a, b) => b.weight - a.weight);
};
