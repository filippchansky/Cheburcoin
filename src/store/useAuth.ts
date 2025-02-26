import { create } from 'zustand';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    initializeAuth: () => () => void; // Функция отписки
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true, // Начальное состояние загрузки
    setUser: (user) => set({ user, isLoading: false }),
    initializeAuth: () => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            set({ user, isLoading: false }); // Снимаем загрузку при изменении auth
        });

        return unsubscribe; // Отписка при размонтировании
    },
}));
