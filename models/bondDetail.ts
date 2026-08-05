/** Одна свеча графика облигации (MOEX candles). */
export interface IBondCandle {
    date: string;
    close: number;
    open: number;
    high: number;
    low: number;
}

/** Одна купонная выплата (из эндпоинта bondization). */
export interface IBondCoupon {
    /** Дата выплаты. */
    date: string;
    /** Ставка купона, % годовых. */
    percent: number | null;
    /** Сумма купона на одну облигацию (в валюте номинала). */
    value: number;
    /** Уже выплачен (дата в прошлом). */
    isPaid: boolean;
}

/** Ключевая ставка ЦБ РФ. */
export interface IKeyRate {
    /** Ставка, % годовых. */
    rate: number;
    /** Дата, на которую действует ставка. */
    date: string;
}
