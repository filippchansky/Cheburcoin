import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { create } from 'zustand';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../configs/firebase/config';

interface IState {
    token: string | null;
    activeAccounts: string[];
    isLoadingToken: boolean;
    isLoadingAccounts: boolean;
    addToken: (value: string) => Promise<void>;
    addAccounts: (value: string[]) => Promise<void>;
    getToken: () => Promise<void>;
    getActiveAccount: () => Promise<void>;
    initializeAuthListener: () => void;
}

export const useTbankApi = create<IState>((set, get) => ({
    token: null,
    activeAccounts: [],
    isLoadingToken: true,
    isLoadingAccounts: true,

    addToken: async (value) => {
        try {
            if (auth.currentUser) {
                await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                    tokenTbank: value
                });
                set({ token: value });
            }
        } catch (error) {
            console.error('Ошибка при обновлении токена:', error);
        }
    },
    addAccounts: async (value) => {
        try {
            if (auth.currentUser) {
                await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                    activeAccounts: value
                });
                set({ activeAccounts: value });
            }
        } catch (error) {
            console.log(error);
        }
    },

    getToken: async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const token: string = userDoc.data().tokenTbank;
                set({ token, isLoadingToken: false });
            } else {
                set({ isLoadingToken: false });
            }
        } catch (error) {
            console.error('Ошибка при получении токена:', error);
            set({ isLoadingToken: false });
        }
    },

    getActiveAccount: async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const activeAccounts: string[] = userDoc.data().activeAccounts || [];
                set({ activeAccounts, isLoadingAccounts: false });
            } else {
                set({ isLoadingAccounts: false });
            }
        } catch (error) {
            console.error('Ошибка при получении активных аккаунтов:', error);
            set({ isLoadingAccounts: false });
        }
    },

    initializeAuthListener: () => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                await get().getToken(); // Загружаем токен при аутентификации
                await get().getActiveAccount();
            } else {
                set({
                    token: null,
                    isLoadingToken: false,
                    activeAccounts: [],
                    isLoadingAccounts: false
                }); // Очищаем токен, если вышли
            }
        });
    }
}));
