import { IPaymentsResponse } from '@models/tinkoffData';
import { apiTinkoff } from '../instance';

/**
 * История прошедших выплат по счёту (купоны/дивиденды/погашения + налоги).
 * Ошибку пробрасываем — react-query различит loading/error/success.
 */
export const getPayments = async (
    accountId: string,
    from: string,
    to: string,
    token: string
): Promise<IPaymentsResponse> => {
    const res = await apiTinkoff.post(
        '/payments',
        { accountId, from, to },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};
