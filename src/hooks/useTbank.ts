import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../configs/firebase/config';
import { IAccount } from '@models/tinkoffData';

interface TbankData {
    token: string | null;
    accounts: IAccount[];
}

const fetchTbank = async (uid: string): Promise<TbankData> => {
    const snap = await getDoc(doc(db, 'users', uid));
    const data = snap.exists() ? snap.data() : null;
    return {
        token: (data?.tokenTbank as string | undefined) ?? null,
        accounts: (data?.activeAccounts as IAccount[] | undefined) ?? []
    };
};

/** Токен и выбранные счета Т-Банка текущего пользователя. */
export const useTbank = () => {
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useQuery({
        queryKey: ['tbank', uid],
        queryFn: () => fetchTbank(uid as string),
        enabled: !!uid
    });
};

export const useSetTbankToken = () => {
    const queryClient = useQueryClient();
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useMutation({
        mutationFn: async (token: string) => {
            if (!uid) return;
            await updateDoc(doc(db, 'users', uid), { tokenTbank: token });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tbank', uid] })
    });
};

export const useSetTbankAccounts = () => {
    const queryClient = useQueryClient();
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useMutation({
        mutationFn: async (accounts: IAccount[]) => {
            if (!uid) return;
            await updateDoc(doc(db, 'users', uid), { activeAccounts: accounts });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tbank', uid] })
    });
};
