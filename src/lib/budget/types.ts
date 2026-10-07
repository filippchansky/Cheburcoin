/**
 * Бытовой учёт расходов/доходов — ручной, как «эксель внутри Чебуркоина».
 * Сознательно минимален: одна операция = дата + сумма + тип + категория + заметка.
 * Счетов и привязки к инвест-выплатам (дивиденды/купоны живут в «Выплатах») тут нет.
 *
 * Хранение в Firestore:
 *   users/{uid}/budgetTransactions/{id}  — операции (подколлекция, их много);
 *   users/{uid}.budgetCategories         — список категорий (поле-массив, их мало).
 */

/** Расход или доход. Знак суммы не храним — он следует из типа. */
export type TxType = 'expense' | 'income';

/** Одна операция учёта. */
export interface BudgetTx {
    /** Идентификатор документа Firestore. */
    id: string;
    /** Дата операции, ISO `yyyy-mm-dd` (строка сортируется как дата). */
    date: string;
    /** Сумма в рублях, всегда положительная; направление задаёт `type`. */
    amount: number;
    /** Расход или доход. */
    type: TxType;
    /** Ссылка на категорию (`BudgetCategory.id`). */
    categoryId: string;
    /** Необязательная заметка. */
    note?: string;
    /** Момент создания, epoch ms — вторичная сортировка при равных датах. */
    createdAt: number;
}

/** Черновик операции для создания/редактирования (без служебных полей). */
export type BudgetTxDraft = Omit<BudgetTx, 'id' | 'createdAt'>;

/** Категория расхода/дохода. */
export interface BudgetCategory {
    /** Стабильный id (у дефолтных — осмысленная строка, чтобы не слетали ссылки). */
    id: string;
    /** Отображаемое название. */
    name: string;
    /** К чему относится — к расходам или доходам. */
    type: TxType;
    /** Эмодзи-иконка для списка и формы. */
    icon: string;
    /** HEX-цвет для пончика сводки. */
    color: string;
}

/**
 * Дефолтные категории при первом входе. Возвращаются «в памяти», пока пользователь
 * ничего не менял, и записываются в Firestore лишь при первом редактировании —
 * поэтому id должны быть стабильными: на них ссылаются операции.
 */
export const DEFAULT_CATEGORIES: BudgetCategory[] = [
    // Расходы
    { id: 'food', name: 'Еда и продукты', type: 'expense', icon: '🍎', color: '#ef4444' },
    { id: 'cafe', name: 'Кафе и рестораны', type: 'expense', icon: '🍽️', color: '#f97316' },
    { id: 'transport', name: 'Транспорт', type: 'expense', icon: '🚗', color: '#f59e0b' },
    { id: 'housing', name: 'Жильё и ЖКХ', type: 'expense', icon: '🏠', color: '#84cc16' },
    { id: 'shopping', name: 'Покупки', type: 'expense', icon: '🛍️', color: '#06b6d4' },
    { id: 'health', name: 'Здоровье', type: 'expense', icon: '💊', color: '#3b82f6' },
    { id: 'entertainment', name: 'Развлечения', type: 'expense', icon: '🎬', color: '#8b5cf6' },
    { id: 'investments', name: 'Инвестиции', type: 'expense', icon: '📈', color: '#ec4899' },
    { id: 'other_expense', name: 'Прочее', type: 'expense', icon: '📦', color: '#64748b' },
    // Доходы
    { id: 'salary', name: 'Зарплата', type: 'income', icon: '💼', color: '#16a34a' },
    { id: 'side_income', name: 'Подработка', type: 'income', icon: '💰', color: '#22c55e' },
    { id: 'dividends', name: 'Дивиденды', type: 'income', icon: '💵', color: '#0ea5e9' },
    { id: 'coupons', name: 'Купоны', type: 'income', icon: '🧾', color: '#6366f1' },
    { id: 'gift', name: 'Подарки', type: 'income', icon: '🎁', color: '#10b981' },
    { id: 'other_income', name: 'Прочее', type: 'income', icon: '➕', color: '#14b8a6' }
];

/** Итоги за период: доход, расход и их разница (баланс). */
export interface BudgetTotals {
    income: number;
    expense: number;
    balance: number;
}

/** Считает доход/расход/баланс по списку операций. */
export const sumTotals = (txs: BudgetTx[]): BudgetTotals => {
    let income = 0;
    let expense = 0;
    for (const tx of txs) {
        if (tx.type === 'income') income += tx.amount;
        else expense += tx.amount;
    }
    return { income, expense, balance: income - expense };
};
