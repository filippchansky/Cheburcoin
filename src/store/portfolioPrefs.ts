import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
 * Долгоживущие настройки портфеля — сейчас только параметры цели по пассивному
 * доходу (вкладка «Цель»). Липкость между сессиями через localStorage: это
 * предпочтения пользователя, а не позиция навигации. Навигационное состояние
 * (вкладка, выбранный счёт, режим пончика, подвкладка выплат) живёт в URL —
 * см. usePortfolioNav (nuqs), по аналогии со списками облигаций/акций/фондов.
 */
export const usePortfolioPrefs = create<IState>()(
    persist(
        (set) => ({
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
