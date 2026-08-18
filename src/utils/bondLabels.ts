import { CouponType, IBond, IBondRatingAction } from '@models/bond';

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

/** Тир кредитного рейтинга для окраски бейджа. */
export type RatingTier = 'high' | 'good' | 'moderate' | 'speculative' | 'withdrawn' | 'unknown';

/** Буквенная часть рейтинга без шкалы: «ruAAA»/«AAA(RU)» → «AAA». */
const normalizeRating = (value: string): string =>
    value
        .replace(/\(RU\)/gi, '')
        .replace(/^ru/i, '')
        .replace(/[.\s]/g, '')
        .toUpperCase();

/**
 * Тир рейтинга для цвета: high (AAA/AA), good (A), moderate (BBB),
 * speculative (BB и ниже), withdrawn (отозван), unknown (не распознан).
 */
export const ratingTier = (action: IBondRatingAction): RatingTier => {
    if (action.withdrawn) return 'withdrawn';
    const r = normalizeRating(action.value);
    if (/^AA/.test(r)) return 'high';
    if (/^A/.test(r)) return 'good';
    if (/^BBB/.test(r)) return 'moderate';
    if (/^(BB|B|CCC|CC|C|D|SD|RD)/.test(r)) return 'speculative';
    return 'unknown';
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
 * Спред доходности над ключевой ставкой (п.п.), выше которого бумага считается
 * рискованной: рынок требует премию за риск. 6 п.п. (при ставке 14% → порог YTM 20%)
 * оставляет в основном гос/муни и крепкие корпораты. Единственная «ручка» фильтра.
 */
export const RELIABLE_SPREAD = 6;

/**
 * Цена (% от номинала), ниже которой бумага БЕЗ рассчитанного YTM считается стрессовой.
 * У YTM нет — это либо флоатер (держится у номинала), либо дефолтная бумага, по которой
 * биржа не может посчитать доходность. Различаем их по цене: здоровый флоатер ~90–105%,
 * дефолт обваливается до 20–40%. Порог 80 с запасом отделяет одно от другого.
 */
const DISTRESS_PRICE = 80;

/**
 * Рыночная оценка надёжности для фильтра «Только надёжные»: бумага надёжна, если рынок
 * НЕ закладывает в неё стресс. Опираемся на YTM — он уже вбирает цену: у проблемной
 * бумаги низкая цена даёт высокую доходность. Когда YTM рассчитан, стресс = аномальный
 * YTM (isYieldOutlier) или доходность выше ключевой ставки на RELIABLE_SPREAD. Когда YTM
 * НЕ рассчитан (null), спред применить нельзя — падаем на цену: обвал ниже DISTRESS_PRICE
 * = стресс (ловит дефолтные бумаги вроде RU000A106YN4, у которых MOEX не считает YTM),
 * цена у номинала = норма (флоатеры остаются надёжными).
 *
 * keyRate — текущая ключевая ставка ЦБ, % годовых. Если она ещё не загружена
 * (null/undefined), оценить спред нельзя — считаем бумагу надёжной, чтобы фильтр
 * деградировал в no-op, а не прятал весь список.
 */
export const isReliableBond = (bond: IBond, keyRate: number | null | undefined): boolean => {
    if (keyRate === null || keyRate === undefined) return true;
    if (isYieldOutlier(bond)) return false;
    if (bond.yield === null) {
        return bond.pricePercent === null || bond.pricePercent >= DISTRESS_PRICE;
    }
    return bond.yield <= keyRate + RELIABLE_SPREAD;
};

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
