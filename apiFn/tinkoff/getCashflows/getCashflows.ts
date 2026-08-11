import { ICashflowsResponse } from '@models/tinkoffData';
import { apiTinkoff } from '../instance';

/**
 * Внешние денежные потоки счёта (пополнения/выводы/покупки с карты/дивиденды на
 * карту), свёрнутые по дням со знаком инвестора — вход для XIRR. Зеркалит
 * getPayments/getRealized. Ошибку пробрасываем — react-query различит состояния.
 */
export const getCashflows = async (
    accountId: string,
    from: string,
    to: string,
    token: string
): Promise<ICashflowsResponse> => {
    const res = await apiTinkoff.post(
        '/cashflows',
        { accountId, from, to },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};
