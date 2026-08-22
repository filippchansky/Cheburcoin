import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../configs/firebase/config';
import { CryptoLotsByCoin } from '@/lib/portfolio/cryptoLots';

/**
 * Покупки крипты пользователя (лоты), ЕДИНЫЕ по монете — из них считается
 * средневзвешенная цена и «Прибыль» по крипте (Trezor + Bybit). Хранятся в
 * users/{uid}.cryptoLots = { тикер: [{qty, price}] }.
 */
const fetchCryptoLots = async (uid: string): Promise<CryptoLotsByCoin> => {
    const snap = await getDoc(doc(db, 'users', uid));
    const data = snap.exists() ? snap.data() : null;
    return (data?.cryptoLots as CryptoLotsByCoin | undefined) ?? {};
};

/** Сохранённые покупки крипты (лоты по монетам). */
export const useCryptoLots = () => {
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useQuery({
        queryKey: ['crypto-lots', uid],
        queryFn: () => fetchCryptoLots(uid as string),
        enabled: !!uid
    });
};

/** Сохранить покупки (перезаписывает карту лотов целиком). */
export const useSetCryptoLots = () => {
    const queryClient = useQueryClient();
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useMutation({
        mutationFn: async (lots: CryptoLotsByCoin) => {
            if (!uid) return;
            await updateDoc(doc(db, 'users', uid), { cryptoLots: lots });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['crypto-lots', uid] });
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        }
    });
};
