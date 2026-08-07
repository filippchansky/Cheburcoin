import { CouponType, IBond } from '@models/bond';

/** Подпись и цвет тега для типа купона. */
export const couponTag: Record<CouponType, { label: string; color: string }> = {
    fixed: { label: 'Фикс', color: 'blue' },
    floating: { label: 'Плавающий', color: 'gold' },
    inflation: { label: 'Инфляционный', color: 'green' },
    discount: { label: 'Дисконт', color: 'geekblue' }
};

/** Структурная ось бумаги (одна категория на выпуск) — основа фильтра «Структура». */
export type BondStructure = 'plain' | 'amortizing' | 'structured' | 'convertible';

/**
 * Категория «структуры» выпуска по BONDTYPE: структурная / конвертируемая /
 * амортизируемая / обычная (bullet, всё прочее). Мьютекс — бумага в ровно одной.
 */
export const bondStructure = (bond: IBond): BondStructure => {
    if (bond.bondType.startsWith('Структурн')) return 'structured';
    if (bond.bondType.startsWith('Конверт')) return 'convertible';
    if (bond.hasAmortization) return 'amortizing';
    return 'plain';
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

/**
 * Порог «аномальной» доходности, % годовых. Реальные ВДО упираются в ~30–45%;
 * YTM выше — почти всегда артефакт: дефолтная/предбанкротная бумага или выпуск
 * у самого погашения, где расчёт YTM математически взрывается (вплоть до сотен %).
 * Такие бумаги не должны лидировать в списке и помечаются предупреждением.
 */
export const YIELD_OUTLIER_THRESHOLD = 50;

/** Доходность бумаги выглядит аномальной (вероятен дефолт или ошибка данных). */
export const isYieldOutlier = (bond: IBond): boolean =>
    bond.yield !== null && bond.yield > YIELD_OUTLIER_THRESHOLD;

/**
 * Ранг надёжности для сортировки по умолчанию (меньше — надёжнее):
 * гос (0) → муни (1) → корпораты по уровню листинга (L1=2, L2=3, L3/прочее=4).
 * Опирается на ту же иерархию, что и {@link reliabilityInfo}.
 */
export const reliabilityRank = (bond: IBond): number => {
    if (bond.issuerType === 'government') return 0;
    if (bond.issuerType === 'municipal') return 1;
    if (bond.listLevel === 1) return 2;
    if (bond.listLevel === 2) return 3;
    return 4;
};

/**
 * Компаратор порядка по умолчанию для списка облигаций.
 * Надёжность-тир → доходность убыв. внутри тира, но бумаги с аномальным YTM
 * не лидируют даже внутри своего тира (уходят в его конец).
 */
export const defaultBondOrder = (a: IBond, b: IBond): number => {
    const rankDiff = reliabilityRank(a) - reliabilityRank(b);
    if (rankDiff !== 0) return rankDiff;

    const outlierDiff = Number(isYieldOutlier(a)) - Number(isYieldOutlier(b));
    if (outlierDiff !== 0) return outlierDiff;

    return (b.yield ?? 0) - (a.yield ?? 0);
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
