/**
 * Типы крипто-раздела. Данные приходят с CoinGecko через серверные прокси-роуты
 * (`/api/crypto/*`), которые нормализуют многословные ответы CoinGecko в эти формы —
 * клиент про исходный формат CoinGecko ничего не знает.
 */

/** Валюта котировок. CoinGecko отдаёт цену сразу в нужной валюте (vs_currency). */
export type VsCurrency = 'rub' | 'usd';

/** Период графика. Клиентский токен → `days` для CoinGecko маппится на роуте. */
export type ChartPeriod = '24h' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all';

/** Строка таблицы рынка (нормализованный `/coins/markets`). */
export interface ICoinMarket {
    id: string;
    symbol: string;
    name: string;
    icon: string;
    rank: number | null;
    price: number;
    marketCap: number | null;
    volume: number | null;
    priceChange1h: number | null;
    priceChange24h: number | null;
    priceChange7d: number | null;
    /** Цены за 7 дней для спарклайна (в валюте запроса). */
    sparkline: number[];
}

/** Верхняя полоса рынка (нормализованный `/global`). */
export interface IGlobalMarket {
    /** Общая капитализация рынка в валюте запроса. */
    marketCap: number;
    /** Суммарный объём торгов 24ч в валюте запроса. */
    volume: number;
    /** Изменение общей капитализации за 24ч, %. */
    marketCapChange24h: number;
    /** Доминация BTC, %. */
    btcDominance: number;
    /** Доминация ETH, %. */
    ethDominance: number;
}

/** Индекс страха и жадности (alternative.me/fng). */
export interface IFngIndex {
    /** 0–100. */
    value: number;
    /** Текстовая классификация («Extreme Fear» … «Extreme Greed»). */
    classification: string;
}

/** Полная карточка монеты (нормализованный `/coins/{id}`). */
export interface ICoinDetail {
    id: string;
    symbol: string;
    name: string;
    icon: string;
    rank: number | null;
    price: number;
    marketCap: number | null;
    volume: number | null;
    high24h: number | null;
    low24h: number | null;
    priceChange1h: number | null;
    priceChange24h: number | null;
    priceChange7d: number | null;
    circulatingSupply: number | null;
    totalSupply: number | null;
    maxSupply: number | null;
    ath: number | null;
    athDate: string | null;
    atl: number | null;
    atlDate: string | null;
    description: string;
    websiteUrl: string | null;
    twitterUrl: string | null;
    redditUrl: string | null;
    explorerUrl: string | null;
}

/** Оценка сентимента новости. Есть только у CryptoPanic (по голосам сообщества). */
export type NewsSentiment = 'bullish' | 'bearish' | 'neutral';

/**
 * Новостная карточка. Общая лента — русские RSS-источники (без сентимента),
 * лента монеты на детальной — CryptoPanic по тикеру (с сентиментом).
 */
export interface INewsItem {
    id: string;
    title: string;
    url: string;
    /** Имя источника («ForkLog», «CryptoPanic» и т.п.). */
    source: string;
    /** ISO-время публикации. */
    publishedAt: string;
    /** Картинка превью (если источник её отдаёт). */
    imageUrl: string | null;
    /** Тональность — только у CryptoPanic. */
    sentiment?: NewsSentiment;
}

/** Точка графика: [timestamp мс, цена]. */
export type ChartPoint = [number, number];

/** Ответ роута графика. */
export interface ICoinChart {
    prices: ChartPoint[];
}
