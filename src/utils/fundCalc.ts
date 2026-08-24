/** Правильное склонение слова «пай» по числу: 1 пай, 2 пая, 5 паёв. */
export const pluralPai = (count: number): string => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'пай';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'пая';
    return 'паёв';
};

export interface FundPositionResult {
    /** Сколько лотов помещается в сумму. */
    lots: number;
    /** Итоговое число паёв (лоты × размер лота). */
    quantity: number;
    /** Фактически вложенная сумма (паи × цена), ≤ введённой суммы. */
    invested: number;
    /** Остаток суммы, не вложенный в целые лоты. */
    remainder: number;
}

/**
 * Расчёт позиции по фонду: сколько паёв куплю на сумму. Паи торгуются лотами
 * (LOTSIZE, у большинства фондов = 1) — округляем вниз до целого лота.
 * Дивидендов у большинства БПИФ нет (доход реинвестируется в цену пая),
 * поэтому прогноза выплат здесь нет — только количество и вложенная сумма.
 */
export const calcFundPosition = (
    amount: number,
    price: number | null,
    lotSize: number | null
): FundPositionResult | null => {
    if (!price || price <= 0) return null;

    const lot = lotSize && lotSize > 0 ? lotSize : 1;
    const lots = amount > 0 ? Math.floor(amount / (price * lot)) : 0;
    const quantity = lots * lot;
    const invested = quantity * price;

    return {
        lots,
        quantity,
        invested,
        remainder: amount - invested
    };
};
