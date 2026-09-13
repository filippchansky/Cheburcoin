import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AllocationMode } from '@/utils/portfolioAllocation';

/** Вид дашборда портфеля: сводка, аналитика, выплаты или цель по доходу. */
export type PortfolioView = 'overview' | 'analytics' | 'payments' | 'goal';

/** Вкладка внутри «Выплат»: будущее (календарь) или прошлое (история). */
export type PaymentsTab = 'calendar' | 'history';

/**
 * Параметры цели по пассивному доходу (вкладка «Цель»). Доходность, рост и
 * пополнение задаются пользователем; null у доходности — «взять текущую по
 * портфелю» (дефолт, пока пользователь не переопределил вручную).
 */
export interface GoalPrefs {
    /** Целевой пассивный доход, ₽/мес. */
    targetMonthly: number;
    /** Ежемесячное пополнение, ₽/мес. */
    monthlyContribution: number;
    /** Ожидаемая дивдоходность, % годовых. null — брать текущую по портфелю. */
    dividendYieldPct: number | null;
    /** Ожидаемый рост цены бумаг, % годовых. */
    priceGrowthPct: number;
    /** Рост выплат эмитентами, % годовых. */
    incomeGrowthPct: number;
    /** Инфляция, % годовых — доход и капитал приводятся к сегодняшним рублям. */
    inflationPct: number;
    /** Реинвестировать выплаты. */
    reinvest: boolean;
}

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
    /** Параметры цели по пассивному доходу. */
    goal: GoalPrefs;
    setGoal: (patch: Partial<GoalPrefs>) => void;
}

const DEFAULT_GOAL: GoalPrefs = {
    targetMonthly: 100000,
    monthlyContribution: 0,
    dividendYieldPct: null,
    priceGrowthPct: 0,
    incomeGrowthPct: 0,
    inflationPct: 8,
    reinvest: true
};

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
            setPaymentsTab: (value) => set({ paymentsTab: value }),
            goal: DEFAULT_GOAL,
            setGoal: (patch) => set((state) => ({ goal: { ...state.goal, ...patch } }))
        }),
        {
            name: 'portfolioPrefs',
            storage: createJSONStorage(() => localStorage),
            // Глубокое слияние goal: у вернувшихся пользователей в хранилище может не
            // быть новых полей (напр. inflationPct) — берём для них дефолт, а не undefined.
            merge: (persisted, current) => {
                const prev = (persisted ?? {}) as Partial<IState>;
                return {
                    ...current,
                    ...prev,
                    goal: { ...current.goal, ...(prev.goal ?? {}) }
                };
            }
        }
    )
);
