import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../configs/firebase/config';
import {
    BudgetCategory,
    BudgetTx,
    BudgetTxDraft,
    DEFAULT_CATEGORIES
} from '@/lib/budget/types';

/* --------------------------------- Категории -------------------------------- */

/**
 * Категории пользователя из `users/{uid}.budgetCategories`. Пока поле пустое —
 * отдаём дефолтный набор «в памяти» (в Firestore ничего не пишем до первой правки),
 * поэтому id дефолтных категорий обязаны быть стабильными: на них ссылаются операции.
 */
const fetchCategories = async (uid: string): Promise<BudgetCategory[]> => {
    const snap = await getDoc(doc(db, 'users', uid));
    const stored = snap.exists() ? (snap.data().budgetCategories as BudgetCategory[] | undefined) : undefined;
    return stored && stored.length ? stored : DEFAULT_CATEGORIES;
};

/** Список категорий (с дефолтами, если пользователь ещё ничего не настраивал). */
export const useBudgetCategories = () => {
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useQuery({
        queryKey: ['budget-categories', uid],
        queryFn: () => fetchCategories(uid as string),
        enabled: !!uid
    });
};

/** Сохранить список категорий целиком (перезапись поля, как у крипто-лотов). */
export const useSaveBudgetCategories = () => {
    const queryClient = useQueryClient();
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useMutation({
        mutationFn: async (categories: BudgetCategory[]) => {
            if (!uid) return;
            await updateDoc(doc(db, 'users', uid), { budgetCategories: categories });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budget-categories', uid] });
        }
    });
};

/* --------------------------------- Операции --------------------------------- */

const txCollection = (uid: string) => collection(db, 'users', uid, 'budgetTransactions');

/**
 * Все операции пользователя. Сортируем на клиенте (дата desc, затем createdAt desc):
 * для личного бюджета объём небольшой, зато не нужен составной индекс Firestore.
 */
const fetchTransactions = async (uid: string): Promise<BudgetTx[]> => {
    const snap = await getDocs(txCollection(uid));
    const txs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BudgetTx, 'id'>) }));
    return txs.sort((a, b) =>
        a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1
    );
};

/** Операции учёта текущего пользователя (новые сверху). */
export const useBudgetTransactions = () => {
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useQuery({
        queryKey: ['budget-tx', uid],
        queryFn: () => fetchTransactions(uid as string),
        enabled: !!uid
    });
};

/** Добавить операцию. */
export const useAddBudgetTx = () => {
    const queryClient = useQueryClient();
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useMutation({
        mutationFn: async (draft: BudgetTxDraft) => {
            if (!uid) return;
            await addDoc(txCollection(uid), { ...draft, createdAt: Date.now() });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budget-tx', uid] });
        }
    });
};

/** Изменить операцию (по id). */
export const useUpdateBudgetTx = () => {
    const queryClient = useQueryClient();
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useMutation({
        mutationFn: async ({ id, patch }: { id: string; patch: Partial<BudgetTxDraft> }) => {
            if (!uid) return;
            await updateDoc(doc(db, 'users', uid, 'budgetTransactions', id), patch);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budget-tx', uid] });
        }
    });
};

/** Удалить операцию (по id). */
export const useDeleteBudgetTx = () => {
    const queryClient = useQueryClient();
    const [user] = useAuthState(auth);
    const uid = user?.uid;

    return useMutation({
        mutationFn: async (id: string) => {
            if (!uid) return;
            await deleteDoc(doc(db, 'users', uid, 'budgetTransactions', id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budget-tx', uid] });
        }
    });
};
