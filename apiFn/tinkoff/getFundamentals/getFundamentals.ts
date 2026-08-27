import { IShareFundamentals } from '@models/shareDetail';
import { apiTinkoff } from '../instance';

/**
 * Фундаментальные показатели одной акции через прокси `POST /fundamentals`.
 * Источник — Т-Банк (GetAssetFundamentals), поэтому нужен токен пользователя.
 * Возвращает `null`, если у бумаги нет фундаментала (фонд/валюта/делистинг).
 * Ошибку пробрасываем — react-query различит loading/error/success.
 */
export const getFundamentalsTinkoff = async (
    ticker: string,
    token: string
): Promise<IShareFundamentals | null> => {
    const res = await apiTinkoff.post(
        '/fundamentals',
        { ticker },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data?.fundamentals ?? null;
};
