import { CouponType } from '@models/bond';

/** Подпись и цвет тега для типа купона. */
export const couponTag: Record<CouponType, { label: string; color: string }> = {
    fixed: { label: 'Фикс', color: 'blue' },
    floating: { label: 'Плавающий', color: 'gold' },
    inflation: { label: 'Инфляционный', color: 'green' }
};

/** «182 дн.» → «раз в полгода» и т.п. (приблизительно). */
export const couponPeriodLabel = (days: number): string => {
    if (!days) return '—';
    const perYear = Math.round(365 / days);
    if (perYear >= 12) return 'ежемесячно';
    if (perYear === 4) return 'ежеквартально';
    if (perYear === 2) return 'раз в полгода';
    if (perYear === 1) return 'раз в год';
    return `каждые ${days} дн.`;
};
