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

/**
 * Фундаментальные показатели акции (Т-Банк GetAssetFundamentals).
 * Все проценты — уже в процентах (roe=23.44 → «23.44%»), freeFloat нормализован
 * бэком из доли в проценты. Коэффициенты (peRatio, evToEbitda, beta…) — «разы».
 * marketCap/eps — в валюте `currency`. null = данных нет (прочерк).
 */
export interface IShareFundamentals {
    currency: string | null;

    // Оценка
    peRatio: number | null;
    priceToSales: number | null;
    priceToBook: number | null;
    evToEbitda: number | null;
    marketCap: number | null;

    // Рентабельность (%)
    roe: number | null;
    roa: number | null;
    roic: number | null;
    netMargin: number | null;

    // Долг / устойчивость
    netDebtToEbitda: number | null;
    totalDebtToEbitda: number | null;
    currentRatio: number | null;

    // Рост (%)
    revenueGrowth1y: number | null;
    revenueGrowth5y: number | null;

    // Дивиденды / выкуп (%)
    dividendYield: number | null;
    dividendPayoutRatio: number | null;
    buyBack: number | null;

    // Прочее
    beta: number | null;
    /** Free-float в процентах (0.48 доли → 48). */
    freeFloat: number | null;
    eps: number | null;
    employees: number | null;
    /** Дата ближайшей отсечки, ISO-строка. */
    exDividendDate: string | null;
}

/** Рекомендация аналитика: покупать / держать / продавать. */
export type Recommendation = 'BUY' | 'HOLD' | 'SELL';

/** Консенсус-прогноз аналитиков по бумаге (агрегат). */
export interface IShareForecastConsensus {
    recommendation: Recommendation | null;
    currency: string | null;
    currentPrice: number | null;
    /** Консенсус целевой цены. */
    targetPrice: number | null;
    minTarget: number | null;
    maxTarget: number | null;
    /** Потенциал к текущей цене, %. */
    priceChangeRel: number | null;
    prognosisDate: string | null;
    /** Число инвестдомов с рекомендацией «покупать». */
    buy: number;
    hold: number;
    sell: number;
}

/** Прогноз одного инвестдома. */
export interface IShareForecastTarget {
    company: string | null;
    recommendation: Recommendation | null;
    currency: string | null;
    currentPrice: number | null;
    targetPrice: number | null;
    priceChangeRel: number | null;
    date: string | null;
}

/** Прогнозы аналитиков по бумаге (Т-Банк GetForecastBy). */
export interface IShareForecast {
    consensus: IShareForecastConsensus | null;
    targets: IShareForecastTarget[];
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
