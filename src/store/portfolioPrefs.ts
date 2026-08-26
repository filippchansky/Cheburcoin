import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AllocationMode } from '@/utils/portfolioAllocation';

/** Вид дашборда портфеля: сводка или выплаты. */
export type PortfolioView = 'overview' | 'payments';

/** Вкладка внутри «Выплат»: будущее (календарь) или прошлое (история). */
export type PaymentsTab = 'calendar' | 'history';

interface IState {
    /** Выбранный счёт: 'all' (сводно) или id счёта. */
    scope: string;
    setScope: (value: string) => void;
    /** Вкладка дашборда (обзор/выплаты). */
    view: PortfolioView;
    setView: (value: PortfolioView) => void;
    /** Режим пончика распределения (классы/сектора/бумаги). */
    allocMode: AllocationMode;
    setAllocMode: (value: AllocationMode) => void;
    /** Вкладка внутри «Выплат» (календарь/история). */
    paymentsTab: PaymentsTab;
    setPaymentsTab: (value: PaymentsTab) => void;
}

/**
 * Настройки просмотра портфеля (выбранный счёт, вкладка, режим пончика).
 * Липкость между сессиями через localStorage — сознательно НЕ URL: здесь нужна
 * персистентность предпочтений, а не привязка к истории навигации (в отличие от
 * списков облигаций/акций/фондов на nuqs). Несуществующий счёт откатывается на
 * 'all' в самом дашборде (effectiveScope).
 */
export const usePortfolioPrefs = create<IState>()(
    persist(
        (set) => ({
            scope: 'all',
            setScope: (value) => set({ scope: value }),
            view: 'overview',
            setView: (value) => set({ view: value }),
            allocMode: 'type',
            setAllocMode: (value) => set({ allocMode: value }),
            paymentsTab: 'calendar',
            setPaymentsTab: (value) => set({ paymentsTab: value })
        }),
        {
            name: 'portfolioPrefs',
            storage: createJSONStorage(() => localStorage)
        }
    )
);
