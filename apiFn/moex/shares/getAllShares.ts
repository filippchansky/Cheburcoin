import { IShares } from '@models/allSharesData';
import { apiMoex } from '../instance';

export const getAllShares = async (): Promise<IShares> => {
    const { data } = await apiMoex.get<IShares>(
        'iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off'
    );

    return data;
};
