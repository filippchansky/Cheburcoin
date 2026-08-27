import { IInstrumentNewsItem } from '@models/instrumentNews';
import { apiTinkoff } from '../instance';

/**
 * Лента Пульса по инструменту через прокси `POST /instrument-news`.
 * Работает по тикеру акции И по SECID облигации. Эндпоинт ПУБЛИЧНЫЙ —
 * токен не нужен (в отличие от прочих tinkoff-клиентов). Ошибку пробрасываем.
 */
export const getInstrumentNewsTinkoff = async (
    ticker: string
): Promise<IInstrumentNewsItem[]> => {
    const res = await apiTinkoff.post('/instrument-news', { ticker });
    return res.data?.posts ?? [];
};
