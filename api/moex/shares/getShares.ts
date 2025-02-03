import { IShares } from '@models/allSharesData';
import { apiMoex } from '../instance';

export const getShare = async (ticker: string) => {
    const { data } = await apiMoex.get<IShares>(
        `iss/engines/stock/markets/shares/boards/TQBR/securities/${ticker}.json?iss.meta=off`
    );

    return data;
};
