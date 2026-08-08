export interface IFilteredShares {
    id: string;
    ticker: string;
    title: string;
    icon: string;
    price: number;
    openPrice: number;
    lowPrice: number;
    highPrice: number;
    /** Цена вчерашнего закрытия (PREVPRICE). */
    prevPrice: number;
    capitalization: number;
    /** Оборот за день в деньгах, ₽ (VALTODAY) — мера ликвидности. */
    valToday: number;
    /** Изменение за день в рублях, от вчерашнего закрытия (LAST − PREVPRICE). */
    dayChange: number;
    /** Изменение за день в процентах, от вчерашнего закрытия (LASTTOPREVPRICE). */
    dayChangePercent: number;

    // --- Поля, дополняемые на странице из внешних источников (в mapShares их нет). ---
    /** Сектор из отраслевых индексов MOEX (useSectors); '' — неизвестен. */
    sector?: string;
    /** Годовой дивиденд на акцию, ₽, из build-time карты (useSharesMeta). */
    annualDiv?: number | null;
    /** Дивидендная доходность к текущей цене, % (annualDiv / price * 100). */
    dividendYield?: number | null;
}
