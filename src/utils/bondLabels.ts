import { CouponType, IBond } from '@models/bond';

/** Подпись и цвет тега для типа купона. */
export const couponTag: Record<CouponType, { label: string; color: string }> = {
    fixed: { label: 'Фикс', color: 'blue' },
    floating: { label: 'Плавающий', color: 'gold' },
    inflation: { label: 'Инфляционный', color: 'green' }
};

/** Расшифровка биржевого уровня листинга (не кредитный риск). */
const listLevelHint = (level: number): string => {
    if (level === 1) return 'Первый уровень — высший котировальный список: строгие требования к эмитенту и раскрытию информации.';
    if (level === 2) return 'Второй уровень — котировальный список с умеренными требованиями.';
    return 'Третий уровень — некотировальная часть: минимальные требования биржи.';
};

/** Наглядная оценка надёжности: бейдж-тег + пояснение. */
export interface ReliabilityInfo {
    label: string;
    color: string;
    tooltip: string;
}

/**
 * Человеко-понятная надёжность облигации.
 * Сейчас различает класс эмитента по SECTYPE; для корпоратов показывает
 * кредитный рейтинг (когда появится источник) или уровень листинга.
 */
export const reliabilityInfo = (bond: IBond): ReliabilityInfo => {
    if (bond.issuerType === 'government') {
        return {
            label: 'Гособлигация',
            color: 'green',
            tooltip:
                'Федеральная государственная облигация (ОФЗ) — прямые обязательства государства. Суверенный риск, самый надёжный класс на рынке.'
        };
    }
    if (bond.issuerType === 'municipal') {
        return {
            label: 'Муниципальная',
            color: 'cyan',
            tooltip:
                'Облигация региона или муниципалитета — квазигосударственный риск, обычно высокая надёжность.'
        };
    }
    // Корпоративная: приоритет — кредитный рейтинг, иначе уровень листинга.
    if (bond.creditRating) {
        return {
            label: bond.creditRating,
            color: 'blue',
            tooltip: `Кредитный рейтинг эмитента: ${bond.creditRating}. Уровень листинга: ${bond.listLevel}.`
        };
    }
    return {
        label: `Листинг ${bond.listLevel} ур.`,
        color: bond.listLevel === 1 ? 'blue' : bond.listLevel === 2 ? 'gold' : 'default',
        tooltip: `${listLevelHint(bond.listLevel)} Это требования биржи к эмитенту, а не оценка кредитного риска.`
    };
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
