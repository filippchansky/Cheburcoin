import { IShares } from '@models/allSharesData';
import { getShare } from '../shares/getShares';
import { getShareCard, ShareCard } from '../shares/getShareCard';

/** Сырые данные для детальной страницы фонда: маркетдата TQBR + карточка бумаги. */
export interface IFundDetailRaw {
    board: IShares;
    card: ShareCard;
}

/**
 * Тянет параллельно маркетдату борда TQBR и карточку бумаги. Биржевые фонды живут
 * на том же борде и в том же эндпоинте карточки, что и акции, поэтому переиспользуем
 * низкоуровневые геттеры акций (getShare/getShareCard) — отличается только маппинг.
 */
export const getFundDetail = async (ticker: string): Promise<IFundDetailRaw> => {
    const [board, card] = await Promise.all([getShare(ticker), getShareCard(ticker)]);
    return { board, card };
};
