import { IShares } from '@models/allSharesData';
import { getShare } from './getShares';
import { getShareCard, ShareCard } from './getShareCard';

/** Сырые данные для детальной страницы: маркетдата борда TQBR + карточка бумаги. */
export interface IShareDetailRaw {
    board: IShares;
    card: ShareCard;
}

/**
 * Тянет параллельно маркетдату TQBR и карточку бумаги.
 * Карточка нужна ради полей, которых нет в списочной маркетдате
 * (число акций, уровень листинга, сессии, тип бумаги, дата выпуска).
 */
export const getShareDetail = async (ticker: string): Promise<IShareDetailRaw> => {
    const [board, card] = await Promise.all([getShare(ticker), getShareCard(ticker)]);
    return { board, card };
};
