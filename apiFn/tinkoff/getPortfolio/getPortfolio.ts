import { IPortfolio } from '@models/tinkoffData';
import { apiTinkoff } from '../instance';

export const getPortfolio = async (account: string): Promise<IPortfolio | null> => {
    try {
        const res = await apiTinkoff.post('/portfolio', {
            accountId: account,
            currency: 'RUB'
        });

        if (res.status !== 200) return null;
        return res.data;
    } catch (error) {
        console.error(error);
        return null;
    }
};
