import { IBondsRaw } from '@models/bond';
import { apiMoex } from '../instance';

/** Список ОФЗ (гособлигации, борд TQOB). */
export const getOfzBonds = async (): Promise<IBondsRaw> => {
    const { data } = await apiMoex.get<IBondsRaw>(
        'iss/engines/stock/markets/bonds/boards/TQOB/securities.json?iss.meta=off'
    );

    return data;
};
