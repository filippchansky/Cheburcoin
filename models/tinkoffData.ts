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

/** Категория выплаты для группировки/цвета (совпадает с беком). */
export type PaymentCategory = 'coupon' | 'dividend' | 'repayment' | 'tax' | 'other';

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
}
