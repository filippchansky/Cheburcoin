/**
 * Прогноз достижения цели по пассивному доходу (аналог «Цели» в Snowball).
 *
 * Модель по месяцам: капитал растёт за счёт (1) роста цены бумаг, (2) ежемесячных
 * пополнений и (3) реинвестирования выплат; пассивный доход в каждый момент =
 * капитал × дивдоходность. Доходность может ежегодно подрастать (рост выплат
 * эмитентами). Цель достигнута, когда месячный пассивный доход ≥ целевого.
 *
 * Инфляция учитывается приведением к «сегодняшним рублям»: капитал и доход в
 * траектории дефлируются на накопленную инфляцию, а цель остаётся фиксированной в
 * деньгах сегодня. Так «100к/мес» — это всегда сегодняшняя покупательная способность,
 * а не обесценившиеся будущие рубли. Всё в рублях, ставки — годовые проценты.
 * Чистая функция без сайд-эффектов.
 */

export interface GoalInput {
    /** Текущая стоимость платящих бумаг (по выбранному счёту), ₽. */
    currentValue: number;
    /** Целевой пассивный доход, ₽/мес (в сегодняшних рублях). */
    targetMonthly: number;
    /** Ежемесячное пополнение, ₽/мес. */
    monthlyContribution: number;
    /** Ожидаемая дивидендная/купонная доходность портфеля, % годовых. */
    dividendYieldPct: number;
    /** Ожидаемый рост цены бумаг (без учёта выплат), % годовых. */
    priceGrowthPct: number;
    /** Рост выплат эмитентами (индексация дивидендов/купонов), % годовых. */
    incomeGrowthPct: number;
    /** Инфляция, % годовых — обесценивает будущие рубли (доход/капитал приводятся к сегодняшним). */
    inflationPct: number;
    /** Реинвестировать выплаты (иначе — изымаются, капитал растёт только на пополнения+цену). */
    reinvest: boolean;
    /** Предел симуляции в годах (по умолчанию 60). */
    maxYears?: number;
}

/** Точка траектории: месяц от старта, капитал и пассивный доход (в сегодняшних рублях). */
export interface GoalPoint {
    /** Номер месяца от сегодня (0 — сейчас). */
    month: number;
    /** Капитал на конец месяца в сегодняшних рублях, ₽. */
    capital: number;
    /** Пассивный доход за этот месяц в сегодняшних рублях, ₽ (годовой / 12). */
    monthlyIncome: number;
}

export interface GoalResult {
    /** Целевой доход в год, ₽. */
    targetAnnual: number;
    /** Текущий месячный пассивный доход, ₽ (капитал × доходность / 12). */
    startMonthlyIncome: number;
    /**
     * Капитал, нужный для цели при неизменной доходности, ₽. null — доходность ≤ 0
     * (цель через выплаты недостижима, сколько ни копи).
     */
    requiredCapital: number | null;
    /** Номер месяца достижения цели (0 — уже достигнута). null — не достигнута за maxYears. */
    reachedMonth: number | null;
    /** Траектория для графика (месяц 0 … месяц достижения либо предел). */
    series: GoalPoint[];
    /** Стартовая доходность, использованная в расчёте, % годовых. */
    yieldPct: number;
}

const clampPct = (n: number) => (Number.isFinite(n) ? n : 0);

/**
 * Считает траекторию до достижения цели. Останавливается в месяц достижения (чтобы
 * график заканчивался на пересечении) либо на пределе maxYears, если цель не взята.
 */
export const projectGoal = (input: GoalInput): GoalResult => {
    const currentValue = Math.max(0, input.currentValue || 0);
    const targetMonthly = Math.max(0, input.targetMonthly || 0);
    const monthlyContribution = Math.max(0, input.monthlyContribution || 0);
    const reinvest = input.reinvest;
    const maxMonths = Math.round((input.maxYears ?? 60) * 12);

    const yieldRate0 = clampPct(input.dividendYieldPct) / 100;
    const monthlyPriceReturn = Math.pow(1 + clampPct(input.priceGrowthPct) / 100, 1 / 12) - 1;
    const incomeGrowth = clampPct(input.incomeGrowthPct) / 100;
    const inflation = clampPct(input.inflationPct) / 100;

    const targetAnnual = targetMonthly * 12;
    // Требуемый капитал в сегодняшних рублях: цель зафиксирована в деньгах сегодня,
    // доходность реальная → отношение не зависит от инфляции.
    const requiredCapital = yieldRate0 > 0 ? targetAnnual / yieldRate0 : null;

    let capital = currentValue;
    let yieldRate = yieldRate0;
    const startMonthlyIncome = (capital * yieldRate) / 12;

    const series: GoalPoint[] = [{ month: 0, capital, monthlyIncome: startMonthlyIncome }];
    let reachedMonth: number | null = startMonthlyIncome >= targetMonthly && targetMonthly > 0 ? 0 : null;

    for (let m = 1; m <= maxMonths && reachedMonth === null; m += 1) {
        // Доход, начисленный за месяц (по капиталу на начало месяца) — номинально.
        const monthDividend = (capital * yieldRate) / 12;
        // Рост цены → пополнение → реинвест выплат.
        capital *= 1 + monthlyPriceReturn;
        capital += monthlyContribution;
        if (reinvest) capital += monthDividend;
        // Индексация доходности — раз в год.
        if (m % 12 === 0) yieldRate *= 1 + incomeGrowth;

        // Приведение к сегодняшним рублям: делим на накопленную инфляцию.
        const deflator = Math.pow(1 + inflation, m / 12);
        const monthlyIncome = (capital * yieldRate) / 12 / deflator;
        series.push({ month: m, capital: capital / deflator, monthlyIncome });
        if (monthlyIncome >= targetMonthly && targetMonthly > 0) reachedMonth = m;
    }

    return {
        targetAnnual,
        startMonthlyIncome,
        requiredCapital,
        reachedMonth,
        series,
        yieldPct: yieldRate0 * 100
    };
};

/** Дата достижения из числа месяцев (сегодня + N месяцев). null — если не достигнуто. */
export const reachedDate = (months: number | null): Date | null => {
    if (months === null) return null;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() + months);
    return d;
};

/** «через N лет M мес» из числа месяцев. 0 → «уже достигнута». */
export const humanizeMonths = (months: number | null): string => {
    if (months === null) return 'не достигается';
    if (months === 0) return 'цель уже достигнута';
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const parts: string[] = [];
    if (years > 0) parts.push(`${years} ${plural(years, 'год', 'года', 'лет')}`);
    if (rest > 0) parts.push(`${rest} ${plural(rest, 'месяц', 'месяца', 'месяцев')}`);
    return parts.join(' ') || 'меньше месяца';
};

const plural = (n: number, one: string, few: string, many: string): string => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
};
