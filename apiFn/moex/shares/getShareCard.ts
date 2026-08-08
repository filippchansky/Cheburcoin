import { apiMoex } from '../instance';

/** Карточка бумаги (блок description): плоская карта «имя поля → значение». */
export type ShareCard = Record<string, string | number | null>;

interface CardResponse {
    description: {
        columns: string[];
        data: unknown[][];
    };
}

/**
 * Карточка бумаги MOEX `/iss/securities/{ticker}`.
 * Блок description отдаётся как «ключ-значение» (строка = [NAME, TITLE, VALUE, …]),
 * разворачиваем в плоскую карту NAME → VALUE.
 */
export const getShareCard = async (ticker: string): Promise<ShareCard> => {
    const { data } = await apiMoex.get<CardResponse>(
        `iss/securities/${ticker}.json?iss.meta=off&iss.only=description`
    );

    const card: ShareCard = {};
    for (const row of data.description?.data ?? []) {
        const name = row[0] as string;
        card[name] = row[2] as string | number | null;
    }
    return card;
};
