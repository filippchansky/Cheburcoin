import { IAccount } from '@models/tinkoffData';
import { apiTinkoff } from '../instance';

export const getAccounts = async (token: string): Promise<IAccount[] | null> => {
    try {
        const res = await apiTinkoff.get('/accounts', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (res.status !== 200) return null;

        return res.data;
    } catch (error) {
        console.error(error)
        return null;
    }
};
