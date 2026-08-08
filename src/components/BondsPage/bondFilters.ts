import { IBond } from '@models/bond';
import { BOND_SECTOR_OTHER } from '@api/moex/bonds/bondSectors';
import { bondStructure } from '@/utils/bondLabels';

export const ALL = 'all';

/** Диапазон «от/до» для числового фильтра; null на любом краю = край не задан. */
export type RangeValue = [number | null, number | null];

/**
 * Значение одного фильтра: строка (одиночный выбор), массив строк (мультивыбор),
 * булево (чекбокс — вкл/выкл) или диапазон [от, до] (числовой range-фильтр).
 */
export type FilterValue = string | string[] | boolean | RangeValue;

interface FilterOption {
    label: string;
    value: string;
}

export interface BondFilter {
    /** Ключ во внутреннем состоянии фильтров. */
    key: string;
    /** Подпись/плейсхолдер селекта. */
    label: string;
    /**
     * Тип контрола. По умолчанию 'select'. 'checkbox' — булев вкл/выкл фильтр:
     * снят = ограничения нет, отмечен = оставить только бумаги, для которых match=true.
     * 'range' — числовой диапазон «от/до»: отбор по getValue в границах [от, до].
     */
    type?: 'select' | 'checkbox' | 'range';
    /**
     * Мультивыбор: значение — массив, отбор = бумага подходит под ЛЮБОЕ из выбранных
     * значений (фасетный «показать выбранные виды»); пустой массив = ограничения нет.
     */
    multiple?: boolean;
    /** Статичные опции. Если задан getOptions — используются они. */
    options: FilterOption[];
    /** Опции, зависящие от данных (напр. список секторов). */
    getOptions?: (bonds: IBond[]) => FilterOption[];
    /**
     * Показывать ли фильтр при текущем наборе значений. Скрытый фильтр не рендерится
     * и не участвует в отборе (его значение игнорируется).
     */
    visible?: (filters: Record<string, FilterValue>) => boolean;
    /** Проверка бумаги против ОДНОГО выбранного значения (для select/checkbox). */
    match?: (bond: IBond, value: string) => boolean;
    /**
     * Числовой аксессор для type='range': значение бумаги, которое сравнивается
     * с границами [от, до]. null = у бумаги нет значения → в диапазон не попадает.
     */
    getValue?: (bond: IBond) => number | null;
    /** Суффикс единицы измерения для range-инпутов (напр. '%'). */
    unit?: string;
    /** Шаг для range-инпутов (по умолчанию 1). */
    step?: number;
    /**
     * Показывать в основном ряду всегда. Остальные фильтры прячутся под кнопку
     * «Все фильтры» и группируются по {@link BondFilter.group}.
     */
    primary?: boolean;
    /** Группа в панели расширенных фильтров (для не-primary). См. FILTER_GROUPS. */
    group?: string;
}

/** Смысловые группы расширенных фильтров (порядок — в SECONDARY_GROUP_ORDER). */
export const FILTER_GROUPS = {
    issuer: 'Эмитент',
    yield: 'Купон и доходность',
    issue: 'Параметры выпуска',
    risk: 'Риск и доступ'
} as const;

/** Порядок групп в панели «Все фильтры». */
export const SECONDARY_GROUP_ORDER: string[] = [
    FILTER_GROUPS.issuer,
    FILTER_GROUPS.yield,
    FILTER_GROUPS.issue,
    FILTER_GROUPS.risk
];

/** Уникальные секторы, встречающиеся в данных: «Другое» всегда в конце. */
const collectSectors = (bonds: IBond[]): string[] => {
    const set = new Set<string>();
    bonds.forEach((bond) => {
        if (bond.sector) set.add(bond.sector);
    });
    const list = Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
    return list
        .filter((s) => s !== BOND_SECTOR_OTHER)
        .concat(list.includes(BOND_SECTOR_OTHER) ? [BOND_SECTOR_OTHER] : []);
};

/**
 * Декларативное описание фильтров списка облигаций.
 * Чтобы добавить новый фильтр — достаточно добавить сюда одну запись
 * (плюс, при необходимости, производный атрибут в mapBonds).
 */
export const bondFilters: BondFilter[] = [
    {
        key: 'issuerType',
        label: 'Тип эмитента',
        primary: true,
        options: [
            { label: 'Любой эмитент', value: ALL },
            { label: 'Государственные', value: 'government' },
            { label: 'Муниципальные', value: 'municipal' },
            { label: 'Корпоративные', value: 'corporate' }
        ],
        match: (bond, value) => bond.issuerType === value
    },
    {
        key: 'sector',
        label: 'Сектор',
        group: FILTER_GROUPS.issuer,
        options: [{ label: 'Любой сектор', value: ALL }],
        getOptions: (bonds) => [
            { label: 'Любой сектор', value: ALL },
            ...collectSectors(bonds).map((sector) => ({ label: sector, value: sector }))
        ],
        match: (bond, value) => bond.sector === value
    },
    {
        key: 'couponType',
        label: 'Тип купона',
        primary: true,
        options: [
            { label: 'Любой купон', value: ALL },
            { label: 'Фиксированный', value: 'fixed' },
            { label: 'Плавающий', value: 'floating' },
            { label: 'Инфляционный', value: 'inflation' },
            { label: 'Дисконтный', value: 'discount' }
        ],
        match: (bond, value) => bond.couponType === value
    },
    {
        key: 'structure',
        label: 'Структура',
        group: FILTER_GROUPS.issue,
        // Мультивыбор по BONDTYPE-оси: работает для всего рынка (не только ОФЗ).
        // Пусто = все; выбор сужает до отмеченных видов, снятие «Структурная» — прячет их.
        multiple: true,
        options: [
            { label: 'Обычная', value: 'plain' },
            { label: 'Амортизируемая', value: 'amortizing' },
            { label: 'Структурная', value: 'structured' },
            { label: 'Конвертируемая', value: 'convertible' }
        ],
        match: (bond, value) => bondStructure(bond) === value
    },
    {
        key: 'offer',
        label: 'Оферта',
        group: FILTER_GROUPS.issue,
        options: [
            { label: 'Оферта: любая', value: ALL },
            { label: 'С офертой', value: 'yes' },
            { label: 'Без оферты', value: 'no' }
        ],
        match: (bond, value) => (value === 'yes' ? bond.hasOffer : !bond.hasOffer)
    },
    {
        key: 'qualified',
        label: 'Для квалов',
        group: FILTER_GROUPS.risk,
        // Признак приходит из /api/bonds/flags (undefined = ещё не загружен).
        // «Без квальских» скрывает только достоверно квальские; неизвестные — оставляем.
        options: [
            { label: 'Квал: любой', value: ALL },
            { label: 'Без квальских', value: 'no' },
            { label: 'Только для квалов', value: 'yes' }
        ],
        match: (bond, value) =>
            value === 'yes' ? bond.forQualified === true : bond.forQualified !== true
    },
    {
        key: 'default',
        label: 'Дефолт',
        group: FILTER_GROUPS.risk,
        // Реальный дефолт (HASDEFAULT) и технический (HASTECHNICALDEFAULT) — разные
        // события, поэтому фильтруются раздельно. «Без дефолтных» убирает оба.
        options: [
            { label: 'Дефолт: любой', value: ALL },
            { label: 'Без дефолтных', value: 'no' },
            { label: 'Реальный дефолт', value: 'real' },
            { label: 'Технический дефолт', value: 'tech' }
        ],
        match: (bond, value) => {
            if (value === 'real') return bond.hasDefault === true;
            if (value === 'tech') return bond.hasTechnicalDefault === true;
            // 'no': чистые бумаги — ни реального, ни технического дефолта.
            return bond.hasDefault !== true && bond.hasTechnicalDefault !== true;
        }
    },
    {
        key: 'belowFace',
        label: 'Цена ниже номинала',
        type: 'checkbox',
        group: FILTER_GROUPS.issue,
        // Цена в % от номинала (валютно-независимо): < 100 = торгуется с дисконтом.
        options: [],
        match: (bond) => bond.pricePercent !== null && bond.pricePercent < 100
    },
    {
        key: 'currentYield',
        label: 'Текущая купонная доходность, %',
        type: 'range',
        group: FILTER_GROUPS.yield,
        unit: '%',
        step: 0.5,
        options: [],
        // Купон к текущей цене (couponYieldToPrice). null у флоатеров/неторгуемых —
        // при заданной границе такие бумаги отсеиваются.
        getValue: (bond) => bond.couponYieldToPrice
    },
    {
        key: 'ytm',
        label: 'Доходность к погашению, %',
        type: 'range',
        primary: true,
        unit: '%',
        step: 0.5,
        options: [],
        // Доходность к погашению (YIELD от MOEX). null, если биржа её не рассчитала —
        // при заданной границе такие бумаги отсеиваются.
        getValue: (bond) => bond.yield
    }
];

/**
 * Начальное состояние: чекбокс — false, range — [null, null], мультивыбор —
 * пустой массив, одиночный select — «все» (ALL).
 */
export const defaultFilterValues: Record<string, FilterValue> = Object.fromEntries(
    bondFilters.map((filter) => [
        filter.key,
        filter.type === 'checkbox'
            ? false
            : filter.type === 'range'
              ? ([null, null] as RangeValue)
              : filter.multiple
                ? []
                : ALL
    ])
);

/** Активен ли фильтр — его значение отличается от «по умолчанию». */
export const isFilterActive = (filter: BondFilter, value: FilterValue): boolean => {
    if (filter.type === 'range') {
        const [min, max] = value as RangeValue;
        return min !== null || max !== null;
    }
    if (typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.length > 0;
    return value !== ALL;
};

/**
 * Человекочитаемая подпись активного фильтра для чипа; null — фильтр не активен.
 * options — разрешённый список опций (getOptions(bonds) ?? options) для перевода
 * value → подпись.
 */
export const filterChipLabel = (
    filter: BondFilter,
    value: FilterValue,
    options: FilterOption[]
): string | null => {
    if (!isFilterActive(filter, value)) return null;
    const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

    if (filter.type === 'range') {
        const [min, max] = value as RangeValue;
        const unit = filter.unit ?? '';
        const base = filter.label.replace(/,\s*%$/, '');
        const range =
            min !== null && max !== null
                ? `${min}–${max}${unit}`
                : min !== null
                  ? `от ${min}${unit}`
                  : `до ${max}${unit}`;
        return `${base}: ${range}`;
    }
    if (typeof value === 'boolean') return filter.label;
    // range уже обработан выше → массив здесь это только мультивыбор (string[]).
    if (Array.isArray(value)) return `${filter.label}: ${(value as string[]).map(labelOf).join(', ')}`;
    return `${filter.label}: ${labelOf(value)}`;
};
