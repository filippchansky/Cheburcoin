import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../configs/firebase/config';
import { ITrezorAccount } from '@models/trezor';

/**
 * Подключённые крипто-счёта Trezor текущего пользователя. По образцу useTbank:
 * данные лежат в том же документе users/{uid}, поле `trezorAccounts`. Смена
 * дескрипторов инвалидирует и портфель — крипта вливается в общий дашборд.
 */
const fetchTrezor = async (uid: string): Promise<ITrezorAccount[]> => {
    const snap = await getDoc(doc(db, 'users', uid));
    const data = snap.exists() ? snap.data() : null;
    return (data?.trezorAccounts as ITrezorAccount[] | undefined) ?? [];
};

export const useTrezor = () => {
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useQuery({
        queryKey: ['trezor', uid],
        queryFn: () => fetchTrezor(uid as string),
        enabled: !!uid
    });
};

export const useSetTrezorAccounts = () => {
    const queryClient = useQueryClient();
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useMutation({
        mutationFn: async (accounts: ITrezorAccount[]) => {
            if (!uid) return;
            await updateDoc(doc(db, 'users', uid), { trezorAccounts: accounts });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trezor', uid] });
            // Крипта — часть общего портфеля: пересобрать балансы и агрегат.
            queryClient.invalidateQueries({ queryKey: ['portfolio-crypto'] });
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        }
    });
};

/** Отключение Trezor: очищаем сохранённые дескрипторы текущего пользователя. */
export const useDisconnectTrezor = () => {
    const queryClient = useQueryClient();
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useMutation({
        mutationFn: async () => {
            if (!uid) return;
            await updateDoc(doc(db, 'users', uid), { trezorAccounts: [] });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trezor', uid] });
            queryClient.removeQueries({ queryKey: ['portfolio-crypto'] });
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        }
    });
};
