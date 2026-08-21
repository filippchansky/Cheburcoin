import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../configs/firebase/config';

/**
 * Ключи Bybit текущего пользователя (read-only). Хранятся в Firestore
 * users/{uid} открытым видом — как токен Т-Банка (см. useTbank): защита через
 * Firestore Security Rules + сам ключ создаётся без прав Trade/Withdraw, поэтому
 * блэк-радиус утечки ограничен чтением балансов.
 *
 * Ключи НЕ используются в браузере для подписи — они уходят в /api/bybit, где
 * secret подписывает запрос на сервере (в клиентский JS secret не попадает).
 */
export interface BybitCreds {
    apiKey: string | null;
    apiSecret: string | null;
}

const fetchBybit = async (uid: string): Promise<BybitCreds> => {
    const snap = await getDoc(doc(db, 'users', uid));
    const data = snap.exists() ? snap.data() : null;
    return {
        apiKey: (data?.bybitApiKey as string | undefined) ?? null,
        apiSecret: (data?.bybitApiSecret as string | undefined) ?? null
    };
};

/** Ключи Bybit текущего пользователя. `enabled`=true, только если пара задана. */
export const useBybit = () => {
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useQuery({
        queryKey: ['bybit', uid],
        queryFn: () => fetchBybit(uid as string),
        enabled: !!uid
    });
};

/** Сохранить пару ключей Bybit пользователя. */
export const useSetBybitCreds = () => {
    const queryClient = useQueryClient();
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useMutation({
        mutationFn: async ({ apiKey, apiSecret }: { apiKey: string; apiSecret: string }) => {
            if (!uid) return;
            await updateDoc(doc(db, 'users', uid), {
                bybitApiKey: apiKey,
                bybitApiSecret: apiSecret
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bybit', uid] });
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        }
    });
};

/** Отключение Bybit: стираем ключи текущего пользователя. */
export const useDisconnectBybit = () => {
    const queryClient = useQueryClient();
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useMutation({
        mutationFn: async () => {
            if (!uid) return;
            await updateDoc(doc(db, 'users', uid), {
                bybitApiKey: null,
                bybitApiSecret: null
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bybit', uid] });
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        }
    });
};
