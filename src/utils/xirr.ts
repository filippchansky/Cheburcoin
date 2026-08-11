export interface CashflowPoint {
    /** Дата потока (ISO/‘YYYY-MM-DD’ или Date). */
    date: string | Date;
    /** Знаковая сумма: вклад инвестора «−», деньги инвестору/терминальная стоимость «+». */
    amount: number;
}

const DAY_MS = 1000 * 60 * 60 * 24;
const YEAR_DAYS = 365;
const round4 = (n: number) => Number(n.toFixed(4));

/**
 * XIRR — годовая доходность с учётом дат и величины денежных потоков
 * (money-weighted return). Возвращает ставку долей (0.23 = 23% годовых) или
 * null, если посчитать нельзя (нет разнознаковых потоков / не сходится).
 *
 * Метод: Ньютон-Рафсон от 10%, при расхождении — бисекция на [-99.99%, 100000%].
 * Требует хотя бы один отрицательный (вклад) и один положительный (терминальная
 * стоимость/вывод) поток — иначе IRR не определён.
 */
export const xirr = (flows: CashflowPoint[]): number | null => {
    const points = flows
        .map((f) => ({ t: new Date(f.date).getTime(), amount: f.amount }))
        .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.amount) && p.amount !== 0)
        .sort((a, b) => a.t - b.t);

    if (points.length < 2) return null;
    if (!points.some((p) => p.amount > 0) || !points.some((p) => p.amount < 0)) return null;

    const t0 = points[0].t;
    const years = points.map((p) => (p.t - t0) / DAY_MS / YEAR_DAYS);

    const npv = (rate: number) => {
        let sum = 0;
        for (let i = 0; i < points.length; i++) sum += points[i].amount / Math.pow(1 + rate, years[i]);
        return sum;
    };
    const dNpv = (rate: number) => {
        let sum = 0;
        for (let i = 0; i < points.length; i++)
            sum += (-years[i] * points[i].amount) / Math.pow(1 + rate, years[i] + 1);
        return sum;
    };

    // Ньютон-Рафсон.
    let rate = 0.1;
    for (let i = 0; i < 100; i++) {
        const f = npv(rate);
        const d = dNpv(rate);
        if (!Number.isFinite(f) || !Number.isFinite(d) || d === 0) break;
        const next = rate - f / d;
        if (!Number.isFinite(next) || next <= -0.999999) break;
        if (Math.abs(next - rate) < 1e-7) return round4(next);
        rate = next;
    }

    // Фолбэк: бисекция (нужна смена знака NPV на границах).
    let lo = -0.9999;
    let hi = 1000;
    let flo = npv(lo);
    let fhi = npv(hi);
    if (!Number.isFinite(flo) || !Number.isFinite(fhi) || flo * fhi > 0) return null;
    for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        const fmid = npv(mid);
        if (!Number.isFinite(fmid)) return null;
        if (Math.abs(fmid) < 1e-6) return round4(mid);
        if (flo * fmid < 0) {
            hi = mid;
            fhi = fmid;
        } else {
            lo = mid;
            flo = fmid;
        }
    }
    return round4((lo + hi) / 2);
};
