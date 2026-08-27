import { IShareForecast } from '@models/shareDetail';
import { apiTinkoff } from '../instance';

/**
 * Прогнозы аналитиков по одной акции через прокси `POST /forecast`.
 * Источник — Т-Банк (GetForecastBy), поэтому нужен токен пользователя.
 * Возвращает `null`, если по бумаге нет прогноза. Ошибку пробрасываем —
 * react-query различит loading/error/success.
 */
export const getForecastTinkoff = async (
    ticker: string,
    token: string
): Promise<IShareForecast | null> => {
    const res = await apiTinkoff.post(
        '/forecast',
        { ticker },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data?.forecast ?? null;
};
