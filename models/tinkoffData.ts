export interface IAccount {
    id: string;
    name: string;
}

export interface IPortfolio {
    totalAmountShares: number;
    totalAmountBonds: number;
    totalAmountEtf: number;
    totalAmountCurrencies: number;
    totalAmountFutures: number;
    expectedYield: number;
    positions: IPosition[];
    accountId: string;
    totalAmountOptions: number;
    totalAmountSp: number;
    /** Стоимость крипты (Trezor), ₽. Нет у ответов Т-Банка — только у синтетического крипто-счёта. */
    totalAmountCrypto?: number;
    totalAmountPortfolio: number;
    virtualPositions: any[];
    dailyYield: number;
    dailyYieldRelative: number;
    /** Имя счёта фронт берёт из useTbank; бэк его больше не резолвит. */
    name?: string;
    expectedYieldInt: number;
}

/** Одно купонное событие из календаря выплат (ответ прокси `POST /coupons`). */
export interface ICouponEvent {
    /** instrumentUid облигации — ключ для джойна с позицией (ticker/name). */
    instrumentId: string;
    /** Кол-во облигаций в портфеле на момент запроса. */
    quantity: number;
    /** Дата выплаты купона (ISO). */
    couponDate: string;
    /** Дата фиксации реестра (после неё покупка не даёт права на купон). */
    fixDate: string;
    couponNumber: number;
    couponType: string;
    /** Валюта купона (rub/usd/...). Нерублёвые не суммируем в рублёвый итог. */
    currency: string | null;
    /** Купон на одну облигацию. */
    amountPerBond: number;
    /** Сумма выплаты по позиции = amountPerBond × quantity, ДО налога. */
    amount: number;
}

export interface ICouponsResponse {
    events: ICouponEvent[];
}

/** Одно объявленное будущее дивидендное событие (ответ прокси `POST /dividends`). */
export interface IDividendEvent {
    /** instrumentUid акции — ключ для джойна с позицией (ticker/name). */
    instrumentId: string;
    /** Кол-во акций в портфеле на момент запроса. */
    quantity: number;
    /** Дата выплаты дивиденда (ISO). */
    paymentDate: string;
    /** Дата фиксации реестра (держатель на неё получает выплату). */
    recordDate: string | null;
    /** Последний день купить бумагу, чтобы попасть в реестр. */
    lastBuyDate: string | null;
    dividendType: string | null;
    /** Валюта выплаты (rub/usd/...). Нерублёвые не суммируем в рублёвый итог. */
    currency: string | null;
    /** Дивиденд на одну акцию. */
    amountPerShare: number;
    /** Сумма выплаты по позиции = amountPerShare × quantity. */
    amount: number;
}

export interface IDividendsResponse {
    events: IDividendEvent[];
}

/** Категория выплаты для группировки/цвета (совпадает с беком). */
export type PaymentCategory = 'coupon' | 'dividend' | 'repayment' | 'tax' | 'fee' | 'other';

/** Одна фактически прошедшая выплата (ответ прокси `POST /payments`). */
export interface IPaymentItem {
    id: string;
    /** Дата операции (ISO). */
    date: string;
    /** Сырой тип операции Tinkoff (OPERATION_TYPE_*). */
    operationType: string;
    category: PaymentCategory;
    /** Название инструмента из операции (может отсутствовать). */
    name: string | null;
    /** Тикер инструмента (для связки обычка↔префы). */
    ticker: string | null;
    figi: string | null;
    instrumentUid: string | null;
    instrumentType: string | null;
    /** Знаковая сумма: приход «+», удержанный налог «−». Уже с учётом налога и кол-ва. */
    payment: number;
    currency: string | null;
}

export interface IPaymentsResponse {
    items: IPaymentItem[];
}

/** Одна продажа с готовым реализованным результатом (ответ прокси `POST /realized`). */
export interface IRealizedItem {
    id: string;
    /** Дата продажи (ISO). */
    date: string;
    name: string | null;
    ticker: string | null;
    figi: string | null;
    instrumentUid: string | null;
    instrumentType: string | null;
    /** Реализованный P/L по сделке (₽), посчитан Т-Банком. null у валютных конвертаций. */
    realized: number | null;
    /** Относительная доходность сделки, %. */
    realizedRelative: number | null;
    quantity: number | null;
    currency: string | null;
}

export interface IRealizedResponse {
    items: IRealizedItem[];
}

/** Внешний денежный поток за день для XIRR (ответ прокси `POST /cashflows`). */
export interface ICashflowPoint {
    /** День потока ‘YYYY-MM-DD’. */
    date: string;
    /** Знаковая сумма за день: вклад «−», вывод/дивиденд на карту «+», ₽. */
    amount: number;
}

export interface ICashflowsResponse {
    items: ICashflowPoint[];
    hasNonRub: boolean;
    /** Всего внесено (модуль вкладов), ₽ — для сверки. */
    contributions: number;
    /** Всего выведено инвестору (модуль), ₽ — для сверки. */
    distributions: number;
}

export interface IPosition {
    figi: string;
    instrumentType: string;
    quantity: number;
    averagePositionPrice: number;
    expectedYield: number;
    averagePositionPricePt: number;
    currentPrice: number;
    averagePositionPriceFifo: number;
    quantityLots: number;
    blocked: boolean;
    blockedLots: number;
    positionUid: string;
    instrumentUid: string;
    varMargin: number;
    expectedYieldFifo: number;
    dailyYield: number;
    ticker?: string;
    name?: string;
    sector?: string;
    isin?: string;
    priceInPorfolio: number
    expectedYieldPercent: number
    /**
     * Валюта позиции (currentPrice.currency от Т-Банка, коды в нижнем регистре:
     * rub/usd/...). Т-Банк цены позиций к рублю НЕ приводит — форматируем в родной
     * валюте. Агрегаты портфеля (totalAmount*) при этом всегда в рублях. null —
     * старый ответ бека без поля (fallback на рубль в formatAmount).
     */
    currency: string | null
    /**
     * Крипта (Trezor): сколько из `quantity` сейчас в стейкинге, в монетах.
     * Задаётся только для instrumentType='crypto' и только если стейкинг > 0 —
     * иначе undefined. Используется для пометки «в стейкинге» в таблице.
     */
    stakedQuantity?: number
    /**
     * Крипта (Trezor): цена и стоимость позиции в USD. Для двухвалютного показа
     * ($ основной, ₽ снизу). Только instrumentType='crypto'; агрегаты портфеля
     * при этом остаются в рублях (priceInPorfolio).
     */
    usd?: { price: number; value: number }
    /**
     * Прямой URL логотипа (крипта Trezor: локальная иконка монеты). У бумаг лого
     * берётся по ISIN, поэтому здесь undefined.
     */
    logoUrl?: string
}
