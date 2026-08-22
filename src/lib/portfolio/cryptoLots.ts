/**
 * Ручные покупки крипты (лоты) — ЕДИНЫЕ по монете, а не по источнику. Себестоимость
 * привязана к активу (SOL), а не к тому, где он лежит (Trezor/Bybit), поэтому одна
 * средняя цена работает и для кошелька, и для биржи, и для объединённой строки в
 * сводке. Ни Trezor, ни Bybit-спот себестоимость не отдают — вводит пользователь.
 */

/** Одна покупка монеты. */
export interface CryptoLot {
    /** Куплено монет. */
    qty: number;
    /** Цена покупки за 1 монету, USD (крипта котируется к доллару/USDT). */
    price: number;
}

/** Покупки по монетам: тикер (BTC/ETH/SOL/…) → список лотов. */
export type CryptoLotsByCoin = Record<string, CryptoLot[]>;

/** Активы дешевле этого в USD прячем из портфеля (пыль на биржах/кошельках). */
export const MIN_DISPLAY_USD = 1;

/**
 * Средневзвешенная цена покупки из лотов: avg = Σ(qty×price) / Σ(qty).
 * Битые/нулевые лоты отбрасываем; монета без валидных лотов в результат не попадает
 * (→ прибыль по ней не считается, прочерк).
 */
export const lotsToAvgPrices = (lots: CryptoLotsByCoin): Record<string, number> => {
    const out: Record<string, number> = {};
    Object.entries(lots).forEach(([coin, arr]) => {
        let qty = 0;
        let cost = 0;
        (arr ?? []).forEach((lot) => {
            if (lot.qty > 0 && lot.price > 0) {
                qty += lot.qty;
                cost += lot.qty * lot.price;
            }
        });
        if (qty > 0) out[coin] = cost / qty;
    });
    return out;
};
