import { IBondsRaw } from '@models/bond';
import { apiMoex } from '../instance';

/** Борды облигаций MOEX: TQOB — ОФЗ, TQCB — корпоративные и муниципальные. */
export const BOND_BOARDS = ['TQOB', 'TQCB'] as const;
export type BondBoard = (typeof BOND_BOARDS)[number];

/** Сырой список облигаций одного борда. */
export const getBondsByBoard = async (board: BondBoard): Promise<IBondsRaw> => {
    const { data } = await apiMoex.get<IBondsRaw>(
        `iss/engines/stock/markets/bonds/boards/${board}/securities.json?iss.meta=off`
    );

    return data;
};

/** Сырые списки всех бордов из BOND_BOARDS, запрошенные параллельно. */
export const getAllBonds = async (): Promise<IBondsRaw[]> =>
    Promise.all(BOND_BOARDS.map(getBondsByBoard));
