import { IPosition } from '@models/tinkoffData';

/** Метрики концентрации портфеля по стоимости открытых позиций. */
export interface ConcentrationMetrics {
    /** Число бумаг с положительной стоимостью (кэш не в счёт). */
    count: number;
    /** Доля пяти крупнейших бумаг в стоимости всех бумаг (0..1). */
    top5: number;
    /** Индекс Херфиндаля–Хиршмана по долям бумаг (0..1). */
    hhi: number;
    /** «Эффективное число бумаг» = 1/HHI — скольким равным позициям эквивалентен портфель. */
    effectiveN: number;
}

/**
 * Метрики концентрации по стоимости открытых позиций. Кэш исключаем — это не
 * «бумага», а концентрация отвечает на «не слишком ли много в одной бумаге».
 * HHI = Σ(доля_i)²: при равных весах = 1/N, при одной бумаге = 1; 1/HHI даёт
 * «эффективное число бумаг» (портфель как N равновзвешенных позиций).
 * null — если считать не на чем (нет позиций с ценой).
 */
export const concentration = (positions: IPosition[]): ConcentrationMetrics | null => {
    const values = positions
        .map((position) => position.priceInPorfolio ?? 0)
        .filter((value) => value > 0)
        .sort((a, b) => b - a);

    const total = values.reduce((sum, value) => sum + value, 0);
    if (total <= 0 || values.length === 0) return null;

    const hhi = values.reduce((sum, value) => {
        const weight = value / total;
        return sum + weight * weight;
    }, 0);
    const top5 = values.slice(0, 5).reduce((sum, value) => sum + value, 0) / total;

    return {
        count: values.length,
        top5,
        hhi,
        effectiveN: hhi > 0 ? 1 / hhi : values.length
    };
};
