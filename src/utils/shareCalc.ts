import { IShareDividend } from '@models/shareDetail';

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/** Сумма дивидендов на акцию за последние 12 месяцев. */
export const trailingDividends = (dividends: IShareDividend[]): number => {
    const cutoff = Date.now() - YEAR_MS;
    return dividends
        .filter((d) => new Date(d.date).getTime() >= cutoff)
        .reduce((sum, d) => sum + d.value, 0);
};

/** Насколько старой может быть последняя выплата, чтобы считать бумагу платящей дивиденды. */
const STALE_DIVIDEND_MS = 1.5 * YEAR_MS;

/**
 * Годовой дивиденд на акцию для оценки доходности.
 * Основной вариант — выплаты за последние 12 месяцев. Но большинство бумаг РФ
 * платят раз в год, и вне «сезона» окно пустеет — тогда откатываемся на последнюю
 * годовую выплату (12-месячное окно, заканчивающееся датой самой свежей выплаты).
 * Если же последняя выплата старше 18 месяцев — бумага фактически не платит
 * дивиденды (напр. Газпром с 2022 г.), возвращаем 0, чтобы не показывать
 * устаревшую «доходность».
 */
export const annualDividendPerShare = (dividends: IShareDividend[]): number => {
    const trailing = trailingDividends(dividends);
    if (trailing > 0 || !dividends.length) return trailing;

    // dividends отсортированы по дате убыв. — [0] самая свежая выплата.
    const latest = new Date(dividends[0].date).getTime();
    if (Date.now() - latest > STALE_DIVIDEND_MS) return 0;

    const windowStart = latest - YEAR_MS;
    return dividends
        .filter((d) => new Date(d.date).getTime() > windowStart)
        .reduce((sum, d) => sum + d.value, 0);
};

/** Дивидендная доходность за 12 мес: выплаты / цена, %. null при нулевой цене/выплатах. */
export const dividendYield = (annualDiv: number, price: number | null): number | null => {
    if (!price || price <= 0 || annualDiv <= 0) return null;
    return (annualDiv / price) * 100;
};

/**
 * Порог «аномальной» дивдоходности, %. Выше почти всегда артефакт: MOEX отдаёт историю
 * выплат в ₽ без корректировки на сплиты (дивиденд до сплита 1:10 против цены после →
 * доходность ×10), либо это разовый спецдивиденд, который не повторится.
 */
export const DIVIDEND_YIELD_OUTLIER = 40;

/** Аномально высокая дивдоходность — вероятно сплит или разовая спецвыплата, не норма. */
export const isDividendYieldOutlier = (dividendYield: number | null | undefined): boolean =>
    dividendYield != null && dividendYield > DIVIDEND_YIELD_OUTLIER;

export interface SharePositionResult {
    /** Сколько лотов помещается в сумму. */
    lots: number;
    /** Итоговое число акций (лоты × размер лота). */
    quantity: number;
    invested: number;
    /** Прогноз годовых дивидендов по выплатам за последние 12 мес. */
    annualDividends: number;
    dividendYield: number | null;
}

/**
 * Расчёт позиции: сколько акций куплю на сумму и какой ждать дивидендный поток.
 * Акции торгуются лотами (LOTSIZE) — округляем вниз до целого лота.
 */
export const calcSharePosition = (
    amount: number,
    price: number | null,
    lotSize: number | null,
    annualDivPerShare: number
): SharePositionResult | null => {
    if (!price || price <= 0 || amount <= 0) return null;

    const lot = lotSize && lotSize > 0 ? lotSize : 1;
    const lots = Math.floor(amount / (price * lot));
    const quantity = lots * lot;
    const invested = quantity * price;

    return {
        lots,
        quantity,
        invested,
        annualDividends: quantity * annualDivPerShare,
        dividendYield: dividendYield(annualDivPerShare, price)
    };
};
