'use client';
import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';
import type { AllocationMode } from '@/utils/portfolioAllocation';

/** Вид дашборда портфеля: сводка, аналитика, выплаты или цель по доходу. */
export type PortfolioView = 'overview' | 'analytics' | 'payments' | 'goal';

/** Вкладка внутри «Выплат»: будущее (календарь) или прошлое (история). */
export type PaymentsTab = 'calendar' | 'history';

const VIEWS = ['overview', 'analytics', 'payments', 'goal'] as const;
const ALLOC_MODES = ['type', 'sector', 'currency', 'rating', 'asset'] as const;
const PAYMENTS_TABS = ['calendar', 'history'] as const;

interface PortfolioNav {
    /** Вкладка дашборда (обзор/аналитика/выплаты/цель). Query-параметр `view`. */
    view: PortfolioView;
    setView: (value: PortfolioView) => void;
    /** Выбранный счёт: 'all' (сводно) или id счёта. Query-параметр `account`. */
    scope: string;
    setScope: (value: string) => void;
    /** Режим пончика распределения (классы/сектора/валюта/рейтинг/бумаги). Query-параметр `allocation`. */
    allocMode: AllocationMode;
    setAllocMode: (value: AllocationMode) => void;
    /** Вкладка внутри «Выплат» (календарь/история). Query-параметр `paymentsTab`. */
    paymentsTab: PaymentsTab;
    setPaymentsTab: (value: PaymentsTab) => void;
}

/**
 * Навигационное состояние дашборда портфеля в URL (через nuqs) — по аналогии со
 * списками облигаций/акций/фондов (см. useTableUrlState) и вкладками карточек
 * бумаг (InstrumentLayout). Благодаря этому переход на страницу инструмента и
 * «Назад» возвращают ту же вкладку/счёт/разбивку, ссылку можно расшарить, а
 * свежий вход из меню открывается на дефолтах. Значения, равные дефолту, nuqs в
 * строку не пишет; неизвестный/устаревший ключ парсер откатывает на дефолт.
 *
 * Настройки цели по доходу (goal) сюда НЕ входят — это долгоживущие
 * предпочтения (см. usePortfolioPrefs, localStorage), а не позиция навигации.
 */
export function usePortfolioNav(): PortfolioNav {
    const [view, setView] = useQueryState('view', parseAsStringLiteral(VIEWS).withDefault('overview'));
    const [scope, setScope] = useQueryState('account', parseAsString.withDefault('all'));
    const [allocMode, setAllocMode] = useQueryState(
        'allocation',
        parseAsStringLiteral(ALLOC_MODES).withDefault('type')
    );
    const [paymentsTab, setPaymentsTab] = useQueryState(
        'paymentsTab',
        parseAsStringLiteral(PAYMENTS_TABS).withDefault('calendar')
    );

    return {
        view,
        setView: (value) => void setView(value),
        scope,
        setScope: (value) => void setScope(value),
        allocMode,
        setAllocMode: (value) => void setAllocMode(value),
        paymentsTab,
        setPaymentsTab: (value) => void setPaymentsTab(value)
    };
}
