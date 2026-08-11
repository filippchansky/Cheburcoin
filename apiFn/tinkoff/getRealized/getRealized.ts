import { IRealizedResponse } from '@models/tinkoffData';
import { apiTinkoff } from '../instance';

/**
 * Реализованный результат по продажам за период (окно RFC3339). Зеркалит
 * getPayments. Каждая продажа несёт готовый `realized` (P/L из Т-Банка) —
 * FIFO самим считать не нужно. Ошибку пробрасываем — react-query различит
 * loading/error/success.
 */
export const getRealized = async (
    accountId: string,
    from: string,
    to: string,
    token: string
): Promise<IRealizedResponse> => {
    const res = await apiTinkoff.post(
        '/realized',
        { accountId, from, to },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};
