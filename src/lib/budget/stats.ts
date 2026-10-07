/**
 * Агрегаты для вкладки «Сводка» бюджета: разбивка по категориям за период и
 * помесячная динамика доход/расход. Чистые функции — без React и запросов.
 */
import { BudgetCategory, BudgetTx, TxType } from './types';

/** Окно сводки: текущий месяц, текущий год или всё время. */
export type SummaryPeriod = 'month' | 'year' | 'all';

/** Оставляет операции, попадающие в выбранное окно (относительно сегодня). */
export const filterByPeriod = (txs: BudgetTx[], period: SummaryPeriod): BudgetTx[] => {
    if (period === 'all') return txs;
    const now = new Date();
    const prefix =
        period === 'month'
            ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
            : String(now.getFullYear());
    return txs.filter((tx) => tx.date.startsWith(prefix));
};

/** Доля категории в структуре за период. */
export interface CategorySlice {
    id: string;
    name: string;
    icon: string;
    color: string;
    value: number;
    /** Процент от суммы всех показанных категорий, 0–100. */
    pct: number;
}

/**
 * Суммы по категориям заданного типа (расход/доход), по убыванию. Операции без
 * известной категории сводятся в «Без категории». Пустые категории не попадают.
 */
export const categoryBreakdown = (
    txs: BudgetTx[],
    categories: BudgetCategory[],
    type: TxType
): CategorySlice[] => {
    const byId = new Map<string, BudgetCategory>();
    categories.forEach((c) => byId.set(c.id, c));

    const sums = new Map<string, number>();
    let total = 0;
    txs.forEach((tx) => {
        if (tx.type !== type) return;
        sums.set(tx.categoryId, (sums.get(tx.categoryId) ?? 0) + tx.amount);
        total += tx.amount;
    });

    const slices: CategorySlice[] = [];
    sums.forEach((value, id) => {
        const cat = byId.get(id);
        slices.push({
            id,
            name: cat?.name ?? 'Без категории',
            icon: cat?.icon ?? '❓',
            color: cat?.color ?? '#8c8c8c',
            value,
            pct: total > 0 ? (value / total) * 100 : 0
        });
    });
    return slices.sort((a, b) => b.value - a.value);
};

/** Доход и расход за один месяц. */
export interface MonthlyBucket {
    /** Ключ месяца «YYYY-MM». */
    key: string;
    income: number;
    expense: number;
}

/**
 * Помесячная динамика по возрастанию месяца, не более `maxMonths` последних
 * месяцев, где были операции. Для столбиков доход/расход.
 */
export const monthlySeries = (txs: BudgetTx[], maxMonths = 12): MonthlyBucket[] => {
    const map = new Map<string, MonthlyBucket>();
    txs.forEach((tx) => {
        const key = tx.date.slice(0, 7);
        let bucket = map.get(key);
        if (!bucket) {
            bucket = { key, income: 0, expense: 0 };
            map.set(key, bucket);
        }
        if (tx.type === 'income') bucket.income += tx.amount;
        else bucket.expense += tx.amount;
    });
    const sorted = Array.from(map.values()).sort((a, b) => (a.key < b.key ? -1 : 1));
    return sorted.slice(-maxMonths);
};
