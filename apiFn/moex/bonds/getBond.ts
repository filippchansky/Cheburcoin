import { IBond, IBondsRaw } from '@models/bond';
import { apiMoex } from '../instance';
import { mapBonds } from './mapBonds';
import { BOND_BOARDS } from './getBonds';

/**
 * Данные одной облигации по её secid. Бумага может торговаться на TQOB (ОФЗ) или
 * TQCB (корпоративные/муниципальные), поэтому опрашиваем оба борда параллельно и
 * берём первый непустой результат. Если бумага не найдена — возвращаем null
 * (не undefined: react-query запрещает undefined в качестве данных запроса).
 */
export const getBond = async (secid: string): Promise<IBond | null> => {
    const responses = await Promise.all(
        BOND_BOARDS.map((board) =>
            apiMoex
                .get<IBondsRaw>(
                    `iss/engines/stock/markets/bonds/boards/${board}/securities/${secid}.json?iss.meta=off`
                )
                .then((res) => mapBonds(res.data).at(0))
                .catch(() => undefined)
        )
    );

    return responses.find((bond) => bond !== undefined) ?? null;
};
