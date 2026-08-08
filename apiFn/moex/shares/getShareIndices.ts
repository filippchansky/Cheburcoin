import { IShareIndex } from '@models/shareDetail';
import { columnGetter } from '../columnUtils';
import { apiMoex } from '../instance';

interface IndicesResponse {
    indices: {
        columns: string[];
        data: unknown[][];
    };
}

/** Индексы MOEX, в которые сейчас входит бумага `/iss/securities/{ticker}/indices`. */
export const getShareIndices = async (ticker: string): Promise<IShareIndex[]> => {
    const { data } = await apiMoex.get<IndicesResponse>(
        `iss/securities/${ticker}/indices.json?iss.meta=off`
    );

    const col = columnGetter(data.indices?.columns ?? []);

    return (data.indices?.data ?? []).map((row) => ({
        id: col<string>(row, 'SECID'),
        name: col<string>(row, 'SHORTNAME') ?? col<string>(row, 'SECID')
    }));
};
