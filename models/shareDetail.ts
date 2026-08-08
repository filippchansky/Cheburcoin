/** Полные данные одной акции: маркетдата TQBR + карточка бумаги MOEX. */
export interface IShareDetail {
    ticker: string;
    shortName: string;
    fullName: string;
    latName: string;
    isin: string;
    regNumber: string;
    /** «Акция обыкновенная» / «Акция привилегированная». */
    typeName: string;
    isPreferred: boolean;

    // Цена и торги
    price: number | null;
    prevPrice: number | null;
    open: number | null;
    dayLow: number | null;
    dayHigh: number | null;
    /** Изменение за день в валюте бумаги (LAST − PREVPRICE). */
    dayChange: number;
    /** Изменение за день в процентах (LASTTOPREVPRICE). */
    dayChangePercent: number;
    bid: number | null;
    offer: number | null;
    /** Спред bid/ask в валюте бумаги (когда обе котировки есть). */
    spread: number | null;
    /** Средневзвешенная цена за день. */
    waPrice: number | null;

    // Объём торгов сегодня
    volumeToday: number | null;
    valueToday: number | null;
    numTrades: number | null;
    updateTime: string;

    // Размер выпуска / параметры бумаги
    capitalization: number | null;
    issueSize: number | null;
    faceValue: number | null;
    faceUnit: string;
    currency: string;
    lotSize: number | null;
    listLevel: number | null;
    forQualified: boolean;
    issueDate: string;

    // Режимы торгов
    morningSession: boolean;
    eveningSession: boolean;
    weekendSession: boolean;
}

/** Одна дивидендная выплата из истории MOEX. */
export interface IShareDividend {
    /** Дата закрытия реестра (отсечки). */
    date: string;
    value: number;
    currency: string;
}

/** Индекс, в который входит бумага. */
export interface IShareIndex {
    id: string;
    name: string;
}

/** Свеча графика акции. */
export interface IShareCandle {
    date: string;
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
}
