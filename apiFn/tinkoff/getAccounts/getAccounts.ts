import { IAccount } from '@models/tinkoffData';
import { apiTinkoff } from '../instance';

export const getAccounts = async (): Promise<IAccount[] | null> => {
    try {
        const res = await apiTinkoff.get('/accounts', {});

        if (res.status !== 200) return null;
        return res.data;
    } catch (error) {
        console.error(error);
        return null;
    }
};
