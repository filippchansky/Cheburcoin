/** Сырой ответ MOEX ISS по фондам (тот же «колоночный» формат, что у акций/облигаций). */
export interface IFundsRaw {
    securities: { columns: string[]; data: unknown[][] };
    marketdata: { columns: string[]; data: unknown[][] };
}

/**
 * Категория актива фонда (аналог сектора у акций). MOEX её отдельным полем не отдаёт —
 * выводим из названия по ключевым словам (см. fundCategory.ts).
 */
export type FundCategory = 'equity' | 'bonds' | 'money' | 'gold' | 'mixed';

export interface IFund {
    id: string;
    /** Тикер (SECID), напр. «TMOS». */
    secid: string;
    /** Дубликат secid для единообразия с акциями (используется в UI/ссылках). */
    ticker: string;
    /** Короткое имя (SHORTNAME), напр. «TMOS ETF». */
    shortName: string;
    /** Полное описательное имя (SECNAME), напр. «БПИФ Т-КАПИТАЛ ИНДЕКС МОСБИРЖИ». */
    name: string;
    isin: string;

    /** Категория актива, выведенная из названия (см. categorizeFund). */
    category: FundCategory;

    /** Последняя цена пая (LAST), ₽. null — сегодня не торговался. */
    price: number | null;
    /** Изменение за день, % от вчерашнего закрытия (LASTTOPREVPRICE). */
    dayChangePercent: number;
    /** Оборот за день в деньгах, ₽ (VALTODAY) — мера ликвидности фонда. */
    valToday: number;

    /** Уровень листинга (1/2/3). */
    listLevel: number;
    /** Размер лота (у большинства фондов — 1). */
    lotSize: number;
    /** Валюта торгов (у рублёвых БПИФ — SUR). */
    currency: string;
}
