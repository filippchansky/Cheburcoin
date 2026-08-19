import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { VsCurrency } from '@models/crypto';

interface IState {
    /** Валюта котировок крипты (₽/$). Общая для списка и детальной. */
    vs: VsCurrency;
    setVs: (value: VsCurrency) => void;
}

/** Выбор валюты крипто-раздела; переживает перезагрузку (localStorage). */
export const useVsCurrency = create<IState>()(
    persist(
        (set) => ({
            vs: 'usd',
            setVs: (value) => set({ vs: value })
        }),
        {
            name: 'cryptoVsCurrency',
            storage: createJSONStorage(() => localStorage)
        }
    )
);
