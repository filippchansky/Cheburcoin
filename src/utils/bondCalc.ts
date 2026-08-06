import { IBond } from '@models/bond';
import { yearsUntil } from './dateUtils';

/** Результат расчёта вложения в облигацию на заданную сумму. */
export interface BondCalcResult {
    /** Количество облигаций, которое можно купить на сумму. */
    quantity: number;
    /** Цена одной облигации с учётом НКД («грязная» цена), ₽. */
    dirtyPrice: number;
    /** Фактически вложено (quantity × dirtyPrice), ₽. */
    invested: number;
    /** Из вложенного приходится на НКД, ₽. */
    accruedPaid: number;
    /** Один купонный платёж на весь пакет, ₽. */
    couponPerPayment: number;
    /** Купонный доход в год, ₽. null для флоатеров (купон не зафиксирован). */
    couponPerYear: number | null;
    /** Купонный доход в месяц, ₽. null для флоатеров. */
    couponPerMonth: number | null;
    /** Лет до погашения. */
    yearsToMaturity: number | null;
    /** Ориентировочная сумма купонов до погашения, ₽. null для флоатеров. */
    couponsToMaturity: number | null;
    /** Возврат номинала при погашении, ₽. */
    redemption: number;
    /**
     * Ориентировочный доход к погашению, ₽: купоны за весь срок + (номинал − цена покупки).
     * Без реинвестирования и налогов. null для флоатеров.
     */
    profitToMaturity: number | null;
    /** Доходность к погашению из MOEX (YIELD), % годовых. */
    ytm: number | null;
}

/**
 * Считает вложение в облигацию на сумму `amount`.
 * Возвращает null, если у бумаги нет рыночной цены (сегодня не торговалась).
 */
export const calcBondInvestment = (bond: IBond, amount: number): BondCalcResult | null => {
    if (bond.priceValue === null || bond.priceValue <= 0) return null;

    const dirtyPrice = bond.priceValue + bond.accruedInt;
    const quantity = amount > 0 ? Math.floor(amount / dirtyPrice) : 0;
    const invested = quantity * dirtyPrice;
    const accruedPaid = quantity * bond.accruedInt;

    const couponPerPayment = quantity * bond.couponValue;
    const couponPerYear = bond.annualCoupon === null ? null : quantity * bond.annualCoupon;
    const couponPerMonth = couponPerYear === null ? null : couponPerYear / 12;

    const yearsToMaturity = yearsUntil(bond.maturityDate);
    const couponsToMaturity =
        couponPerYear !== null && yearsToMaturity !== null ? couponPerYear * yearsToMaturity : null;

    const redemption = quantity * bond.faceValue;
    const redemptionGain = quantity * (bond.faceValue - bond.priceValue);
    const profitToMaturity = couponsToMaturity === null ? null : couponsToMaturity + redemptionGain;

    return {
        quantity,
        dirtyPrice,
        invested,
        accruedPaid,
        couponPerPayment,
        couponPerYear,
        couponPerMonth,
        yearsToMaturity,
        couponsToMaturity,
        redemption,
        profitToMaturity,
        ytm: bond.yield
    };
};
