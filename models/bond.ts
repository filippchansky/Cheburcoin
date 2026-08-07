/** Сырой ответ MOEX ISS по облигациям (тот же «колоночный» формат, что и у акций). */
export interface IBondsRaw {
    securities: { columns: string[]; data: unknown[][] };
    marketdata: { columns: string[]; data: unknown[][] };
}

/** Тип купона облигации. Определяется по BONDTYPE биржи, с откатом на эвристику. */
export type CouponType = 'fixed' | 'floating' | 'inflation' | 'discount';

/** Класс эмитента — основа для оценки надёжности бумаги. */
export type IssuerType = 'government' | 'municipal' | 'corporate';

export interface IBond {
    id: string;
    secid: string;
    /** Короткое название (SHORTNAME). */
    shortName: string;
    /** Полное название (SECNAME) — содержит код типа, напр. «ОФЗ-ПД …». */
    name: string;

    /** Тип купона: фикс / плавающий / индексируемый номинал / дисконт. */
    couponType: CouponType;
    /**
     * Сырой «Вид облигации» от MOEX (BONDTYPE): «Флоатер», «Структурная облигация»,
     * «Амортизируемые облигации», «Валютные облигации», «Линкер…» и т.п. Одна метка на
     * бумагу — основа для couponType, амортизации и фильтра «Структура».
     */
    bondType: string;
    /** Есть ли амортизация номинала (BONDTYPE «Амортизируемые» или ОФЗ-АД). */
    hasAmortization: boolean;
    /** Есть ли оферта (put/call/buyback). У ОФЗ, как правило, нет. */
    hasOffer: boolean;

    /** Ставка купона в % годовых. null для флоатеров (ставка не фиксирована). */
    couponPercent: number | null;
    /** Купон в валюте на одну облигацию. */
    couponValue: number;
    /** Периодичность купона в днях. */
    couponPeriod: number;

    /**
     * Годовой купон в валюте (couponValue × 365 / couponPeriod).
     * null, если период неизвестен. Работает и для фиксированных, и для флоатеров.
     */
    annualCoupon: number | null;
    /**
     * Купонная доходность к номиналу, % годовых (annualCoupon / faceValue).
     * Для фикс. купона равна couponPercent. null, если купон не рассчитать.
     */
    couponYieldToNominal: number | null;
    /**
     * Текущая доходность — купон к текущей цене, % годовых (annualCoupon / priceValue).
     * null, если облигация сегодня не торговалась (нет цены).
     */
    couponYieldToPrice: number | null;
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
    /** Уровень листинга (1/2/3) — биржевой ярус допуска, не кредитный риск. */
    listLevel: number;

    /** Сырой код SECTYPE MOEX (напр. «3» — федеральная гособлигация). */
    secType: string;
    /** Класс эмитента, выведенный из SECTYPE (для оценки надёжности). */
    issuerType: IssuerType;
    /**
     * Экономический сектор эмитента (напр. «Нефть и газ»). Заполняется для
     * корпоративных бумаг по карте эмитентов; для гос/муни — пустая строка
     * (сектор к ним неприменим). MOEX ISS отрасль облигаций не отдаёт.
     */
    sector: string;
    /**
     * Кредитный рейтинг эмитента (АКРА/Эксперт РА/…). null — недоступен.
     * MOEX ISS его не отдаёт; задел под внешний источник для корпоратов.
     */
    creditRating: string | null;

    isin: string;

    /**
     * Бумага только для квалифицированных инвесторов (ISQUALIFIEDINVESTORS).
     * Заполняется джойном с картой флагов; undefined — карта ещё не загрузилась.
     * MOEX отдаёт этот флаг только в карточке бумаги, не в списочном эндпоинте.
     */
    forQualified?: boolean;
    /**
     * По бумаге допущен дефолт или технический дефолт (HASDEFAULT/HASTECHNICALDEFAULT).
     * Заполняется джойном с картой флагов; undefined — карта ещё не загрузилась.
     */
    hasDefault?: boolean;
}

/**
 * Признаки надёжности бумаги, доступные только в карточке /iss/securities/{secid}
 * (в списочном эндпоинте их нет). Собираются на этапе сборки скриптом
 * scripts/generateBondFlags.mjs в статический public/bonds-flags.json.
 */
export interface IBondFlags {
    /** Бумага только для квалифицированных инвесторов. */
    qualified: boolean;
    /** Допущен дефолт или технический дефолт. */
    hasDefault: boolean;
}

/** Статическая карта признаков надёжности по secid (public/bonds-flags.json). */
export type BondFlagsMap = Record<string, IBondFlags>;
