import { FundCategory, IFund } from '@models/fund';
import { FUND_CATEGORY_LABEL } from '@api/moex/funds/fundCategory';

export const ALL = 'all';

/** Диапазон «от/до» для числового фильтра; null на любом краю = край не задан. */
export type RangeValue = [number | null, number | null];

/**
 * Значение одного фильтра: строка (одиночный выбор), массив строк (мультивыбор),
 * булево (чекбокс) или диапазон [от, до] (числовой range-фильтр).
 */
export type FilterValue = string | string[] | boolean | RangeValue;

interface FilterOption {
    label: string;
    value: string;
}

export interface FundFilter {
    /** Ключ во внутреннем состоянии фильтров. */
    key: string;
    /** Подпись/плейсхолдер контрола. */
    label: string;
    /** Тип контрола. По умолчанию 'select'. */
    type?: 'select' | 'checkbox' | 'range';
    /** Мультивыбор: значение — массив, отбор = фонд подходит под ЛЮБОЕ из значений. */
    multiple?: boolean;
    /** Статичные опции. */
    options: FilterOption[];
    /** Опции, зависящие от данных. */
    getOptions?: (funds: IFund[]) => FilterOption[];
    /** Проверка фонда против ОДНОГО выбранного значения (для select/checkbox). */
    match?: (fund: IFund, value: string) => boolean;
    /** Числовой аксессор для type='range'. null = у фонда нет значения → вне диапазона. */
    getValue?: (fund: IFund) => number | null;
    /** Суффикс единицы для range-инпутов (напр. '%'). */
    unit?: string;
    /** Шаг для range-инпутов (по умолчанию 1). */
    step?: number;
    /** Разрешить отрицательные значения в range (для «Изменение за день»). */
    allowNegative?: boolean;
    /** Показывать в основном ряду всегда (иначе — под кнопкой «Все фильтры»). */
    primary?: boolean;
    /** Группа в панели расширенных фильтров. */
    group?: string;
}

/** Смысловые группы расширенных фильтров. */
export const FILTER_GROUPS = {
    params: 'Параметры и ликвидность'
} as const;

/** Порядок групп в панели «Все фильтры». */
export const SECONDARY_GROUP_ORDER: string[] = [FILTER_GROUPS.params];

/** Опции категорий: все известные категории (порядок фиксированный, осмысленный). */
const CATEGORY_OPTIONS: FilterOption[] = (
    ['equity', 'bonds', 'money', 'gold', 'mixed'] as FundCategory[]
).map((category) => ({ label: FUND_CATEGORY_LABEL[category], value: category }));

/**
 * Декларативное описание фильтров списка фондов.
 * Новый фильтр — одна запись здесь (плюс, при необходимости, поле в mapFunds).
 */
export const fundFilters: FundFilter[] = [
    {
        key: 'category',
        label: 'Категория',
        primary: true,
        // Мультивыбор: пусто = все; иначе фонд подходит под любую из выбранных категорий.
        multiple: true,
        options: CATEGORY_OPTIONS,
        match: (fund, value) => fund.category === value
    },
    {
        key: 'dayChange',
        label: 'Изменение за день, %',
        type: 'range',
        primary: true,
        unit: '%',
        step: 0.5,
        allowNegative: true,
        options: [],
        getValue: (fund) => fund.dayChangePercent
    },
    {
        key: 'listLevel',
        label: 'Уровень листинга',
        group: FILTER_GROUPS.params,
        options: [
            { label: 'Листинг: любой', value: ALL },
            { label: '1 уровень', value: '1' },
            { label: '2 уровень', value: '2' },
            { label: '3 уровень', value: '3' }
        ],
        match: (fund, value) => String(fund.listLevel) === value
    },
    {
        key: 'turnover',
        label: 'Оборот за день, млн ₽',
        type: 'range',
        group: FILTER_GROUPS.params,
        unit: 'млн',
        step: 1,
        options: [],
        getValue: (fund) => fund.valToday / 1e6
    },
    {
        key: 'price',
        label: 'Цена пая, ₽',
        type: 'range',
        group: FILTER_GROUPS.params,
        unit: '₽',
        step: 1,
        options: [],
        getValue: (fund) => fund.price
    }
];

/**
 * Начальное состояние: чекбокс — false, range — [null, null], мультивыбор —
 * пустой массив, одиночный select — «все» (ALL).
 */
export const defaultFilterValues: Record<string, FilterValue> = Object.fromEntries(
    fundFilters.map((filter) => [
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
export const isFilterActive = (filter: FundFilter, value: FilterValue): boolean => {
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
 * options — разрешённый список опций (getOptions(funds) ?? options) для перевода
 * value → подпись.
 */
export const filterChipLabel = (
    filter: FundFilter,
    value: FilterValue,
    options: FilterOption[]
): string | null => {
    if (!isFilterActive(filter, value)) return null;
    const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

    if (filter.type === 'range') {
        const [min, max] = value as RangeValue;
        const unit = filter.unit ?? '';
        const base = filter.label.replace(/,\s*(%|млн ₽|₽)$/, '');
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
    if (Array.isArray(value))
        return `${filter.label}: ${(value as string[]).map(labelOf).join(', ')}`;
    return `${filter.label}: ${labelOf(value)}`;
};
