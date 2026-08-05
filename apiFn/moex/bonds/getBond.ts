import { IBond, IBondsRaw } from '@models/bond';
import { apiMoex } from '../instance';
import { mapBonds } from './mapBonds';

/** Данные одной облигации (борд TQOB) по её secid. */
export const getBond = async (secid: string): Promise<IBond | undefined> => {
    const { data } = await apiMoex.get<IBondsRaw>(
        `iss/engines/stock/markets/bonds/boards/TQOB/securities/${secid}.json?iss.meta=off`
    );

    return mapBonds(data).at(0);
};
