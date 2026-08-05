/** Сырой ответ MOEX ISS по облигациям (тот же «колоночный» формат, что и у акций). */
export interface IBondsRaw {
    securities: { columns: string[]; data: unknown[][] };
    marketdata: { columns: string[]; data: unknown[][] };
}

/** Тип купона облигации (для ОФЗ выводится из кода в SECNAME). */
export type CouponType = 'fixed' | 'floating' | 'inflation';

export interface IBond {
    id: string;
    secid: string;
    /** Короткое название (SHORTNAME). */
    shortName: string;
    /** Полное название (SECNAME) — содержит код типа, напр. «ОФЗ-ПД …». */
    name: string;

    /** Тип купона: фикс / плавающий / индексируемый номинал. */
    couponType: CouponType;
    /** Есть ли амортизация номинала (ОФЗ-АД и т.п.). */
    hasAmortization: boolean;
    /** Есть ли оферта (put/call/buyback). У ОФЗ, как правило, нет. */
    hasOffer: boolean;

    /** Ставка купона в % годовых. null для флоатеров (ставка не фиксирована). */
    couponPercent: number | null;
    /** Купон в валюте на одну облигацию. */
    couponValue: number;
    /** Периодичность купона в днях. */
    couponPeriod: number;
    /** Дата следующего купона. */
    nextCoupon: string;
    /** Накопленный купонный доход (НКД), ₽. */
    accruedInt: number;

    /** Номинал. */
    faceValue: number;
    /** Валюта номинала (SUR/USD/EUR/CNY). */
    currency: string;

    /** Цена в % от номинала (LAST). null, если сегодня не торговалась. */
    pricePercent: number | null;
    /** Цена в валюте номинала (pricePercent% × faceValue). null, если нет цены. */
    priceValue: number | null;
    /** Доходность, % годовых (YIELD). null, если не рассчитана. */
    yield: number | null;
    /** Дюрация в днях (DURATION). null, если не рассчитана. */
    duration: number | null;

    /** Дата погашения. */
    maturityDate: string;
    /** Уровень листинга (1/2/3). */
    listLevel: number;
    isin: string;
}
