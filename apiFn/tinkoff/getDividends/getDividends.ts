import { IDividendsResponse } from '@models/tinkoffData';
import { apiTinkoff } from '../instance';

export interface DividendShareInput {
    instrumentId: string;
    quantity: number;
}

/**
 * Календарь будущих дивидендов по акциям портфеля. Батч: список бумаг
 * (instrumentUid + количество) + окно дат RFC3339. Зеркалит getCoupons.
 * Ошибку пробрасываем — react-query различит loading/error/success.
 */
export const getDividends = async (
    shares: DividendShareInput[],
    from: string,
    to: string,
    token: string
): Promise<IDividendsResponse> => {
    const res = await apiTinkoff.post(
        '/dividends',
        { shares, from, to },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};
