import { IAccount } from '@models/tinkoffData';
import { apiTinkoff } from '../instance';
import axios from 'axios';

export type GetAccountsResult =
    | { ok: true; accounts: IAccount[] }
    | { ok: false; reason: 'invalid-token' | 'network' };

export const getAccounts = async (token: string): Promise<GetAccountsResult> => {
    try {
        const res = await apiTinkoff.get('/accounts', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return { ok: true, accounts: res.data };
    } catch (error) {
        // Прокси отдаёт 401 при невалидном токене (проброшено от Tinkoff),
        // остальное трактуем как сетевую/серверную ошибку.
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        return { ok: false, reason: status === 401 ? 'invalid-token' : 'network' };
    }
};
