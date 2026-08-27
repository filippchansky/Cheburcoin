import { IBondOffer } from '@models/bondDetail';
import { apiTinkoff } from '../instance';

/**
 * Оферты (пут/колл) по облигации через прокси `POST /bond-events`.
 * Источник — Т-Банк (GetBondEvents), поэтому нужен токен пользователя.
 * Возвращает пустой массив, если оферт нет или бумаги нет у Т-Банка.
 * Ошибку пробрасываем — react-query различит loading/error/success.
 */
export const getBondOffersTinkoff = async (
    isin: string,
    token: string
): Promise<IBondOffer[]> => {
    const res = await apiTinkoff.post(
        '/bond-events',
        { isin },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data?.offers ?? [];
};
