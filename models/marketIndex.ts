/** Сырой ответ MOEX ISS по индексам (борд SNDX) — тот же «колоночный» формат, что у акций/фондов. */
export interface IIndicesRaw {
    securities: { columns: string[]; data: unknown[][] };
    marketdata: { columns: string[]; data: unknown[][] };
}

/**
 * Смысловая группа индекса. MOEX её отдельным полем не отдаёт — выводим из SECID и
 * названия по ключевым словам (см. indexGroup.ts). 'main' — широкий рынок (IMOEX и т.п.),
 * 'sector' — отраслевые, 'bonds' — облигационные (RGBI/корп/мун), 'money' — денежный
 * рынок (ставки РЕПО), 'other' — прочее.
 */
export type IndexGroup = 'main' | 'sector' | 'bonds' | 'money' | 'other';

/**
 * Тип расчёта индекса (из колонки CALCMODE): 'price' — ценовой (PR), 'total' —
 * полной доходности (TR/TRB/TRN, с реинвестированием дивидендов). Разделение нужно,
 * чтобы можно было отфильтровать «дубли» полной доходности рядом с ценовым.
 */
export type IndexReturnType = 'price' | 'total';

export interface IIndex {
    id: string;
    /** Код индекса (SECID), напр. «IMOEX». */
    secid: string;
    /** Короткое имя (SHORTNAME), напр. «Индекс МосБиржи». */
    shortName: string;
    /** Полное описательное имя (NAME). */
    name: string;

    /** Смысловая группа (выведена из SECID/названия). */
    group: IndexGroup;
    /** Тип расчёта: ценовой / полной доходности (из CALCMODE). */
    returnType: IndexReturnType;

    /** Текущее значение индекса (CURRENTVALUE, вне торгов — LASTVALUE). null — нет данных. */
    value: number | null;
    /** Изменение за день, % к предыдущему закрытию (LASTCHANGEPRC). */
    dayChangePercent: number;
    /** Изменение за месяц, % (MONTHCHANGEPRC). */
    monthChangePercent: number;
    /** Изменение за год, % (YEARCHANGEPRC). */
    yearChangePercent: number;

    /** Оборот бумаг индекса за день, ₽ (VALTODAY) — мера активности. */
    valToday: number;
    /** Капитализация бумаг индекса, ₽ (CAPITALIZATION). 0 — не рассчитывается. */
    capitalization: number;
    /** Годовой максимум значения (ANNUALHIGH). null — нет данных. */
    annualHigh: number | null;
    /** Годовой минимум значения (ANNUALLOW). null — нет данных. */
    annualLow: number | null;
    /** Число знаков после запятой для форматирования значения (DECIMALS). */
    decimals: number;
    /** Валюта расчёта индекса (CURRENCYID), у большинства — RUB. */
    currency: string;
}

/** Одна бумага в составе индекса (из статистики analytics). */
export interface IIndexConstituent {
    /** Тикер/код бумаги (ticker). */
    ticker: string;
    /** Короткое название бумаги (shortnames). */
    name: string;
    /** Вес в индексе, % (weight). */
    weight: number;
}
