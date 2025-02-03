import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface IState {
    darkTheme: boolean;
    setTheme: (value: boolean) => void;
}

export const useDarkTheme = create<IState>()(
    persist(
        (set) => ({
            darkTheme: true,
            setTheme: (value: boolean) => set({ darkTheme: value })
        }),
        {
            name: 'darkTheme',
            storage: createJSONStorage(() => localStorage)
        }
    )
);
