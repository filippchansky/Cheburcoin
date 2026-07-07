import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../configs/firebase/config';

const fetchFavorites = async (uid: string): Promise<string[]> => {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data().coinList ?? []) : [];
};

/** Список id избранных монет текущего пользователя. */
export const useFavorites = () => {
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useQuery({
        queryKey: ['favorites', uid],
        queryFn: () => fetchFavorites(uid as string),
        enabled: !!uid
    });
};

/** Добавляет/убирает монету из избранного и обновляет кэш. */
export const useToggleFavorite = () => {
    const queryClient = useQueryClient();
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useMutation({
        mutationFn: async ({ coinId, isFavorite }: { coinId: string; isFavorite: boolean }) => {
            if (!uid) return;
            await updateDoc(doc(db, 'users', uid), {
                coinList: isFavorite ? arrayRemove(coinId) : arrayUnion(coinId)
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites', uid] });
        }
    });
};
