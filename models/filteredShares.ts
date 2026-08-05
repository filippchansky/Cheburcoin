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
    /** Изменение за день в рублях, от вчерашнего закрытия (LAST − PREVPRICE). */
    dayChange: number;
    /** Изменение за день в процентах, от вчерашнего закрытия (LASTTOPREVPRICE). */
    dayChangePercent: number;
}
