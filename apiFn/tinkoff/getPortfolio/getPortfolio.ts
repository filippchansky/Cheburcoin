import { IPortfolio } from '@models/tinkoffData';
import { apiTinkoff } from '../instance';

/**
 * Портфель по счёту. Ошибку НЕ глушим в null — пробрасываем, чтобы react-query
 * различал состояния loading / error / success (иначе битый ответ выглядел бы
 * как пустой портфель).
 */
export const getPortfolio = async (account: string, token: string): Promise<IPortfolio> => {
    const res = await apiTinkoff.post(
        '/portfolio',
        {
            accountId: account,
            currency: 'RUB'
        },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};
