import { IIndex, IndexGroup } from '@models/marketIndex';
import { INDEX_GROUP_LABEL } from '@api/moex/indices/indexGroup';

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

export interface IndexFilter {
    /** Ключ во внутреннем состоянии фильтров. */
    key: string;
    /** Подпись/плейсхолдер контрола. */
    label: string;
    /** Тип контрола. По умолчанию 'select'. */
    type?: 'select' | 'checkbox' | 'range';
    /** Мультивыбор: значение — массив, отбор = индекс подходит под ЛЮБОЕ из значений. */
    multiple?: boolean;
    /** Статичные опции. */
    options: FilterOption[];
    /** Опции, зависящие от данных. */
    getOptions?: (indices: IIndex[]) => FilterOption[];
    /** Проверка индекса против ОДНОГО выбранного значения (для select/checkbox). */
    match?: (index: IIndex, value: string) => boolean;
    /** Числовой аксессор для type='range'. null = у индекса нет значения → вне диапазона. */
    getValue?: (index: IIndex) => number | null;
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
    params: 'Параметры'
} as const;

/** Порядок групп в панели «Все фильтры». */
export const SECONDARY_GROUP_ORDER: string[] = [FILTER_GROUPS.params];

/** Опции групп индексов (фиксированный осмысленный порядок). */
const GROUP_OPTIONS: FilterOption[] = (
    ['main', 'sector', 'bonds', 'money', 'other'] as IndexGroup[]
).map((group) => ({ label: INDEX_GROUP_LABEL[group], value: group }));

/** Опции типа расчёта. */
const RETURN_TYPE_OPTIONS: FilterOption[] = [
    { label: 'Ценовой', value: 'price' },
    { label: 'Полной доходности', value: 'total' }
];

/**
 * Декларативное описание фильтров списка индексов.
 * Новый фильтр — одна запись здесь (плюс, при необходимости, поле в mapIndices).
 */
export const indexFilters: IndexFilter[] = [
    {
        key: 'group',
        label: 'Группа',
        primary: true,
        multiple: true,
        options: GROUP_OPTIONS,
        match: (index, value) => index.group === value
    },
    {
        key: 'returnType',
        label: 'Тип расчёта',
        primary: true,
        multiple: true,
        options: RETURN_TYPE_OPTIONS,
        match: (index, value) => index.returnType === value
    },
    {
        key: 'dayChange',
        label: 'Изменение за день, %',
        type: 'range',
        group: FILTER_GROUPS.params,
        unit: '%',
        step: 0.5,
        allowNegative: true,
        options: [],
        getValue: (index) => index.dayChangePercent
    },
    {
        key: 'currency',
        label: 'Валюта',
        group: FILTER_GROUPS.params,
        options: [{ label: 'Валюта: любая', value: ALL }],
        // Валюты берём из данных: у большинства индексов RUB, у части — USD.
        getOptions: (indices) => [
            { label: 'Валюта: любая', value: ALL },
            ...Array.from(new Set(indices.map((index) => index.currency)))
                .sort()
                .map((currency) => ({ label: currency, value: currency }))
        ],
        match: (index, value) => index.currency === value
    }
];

/**
 * Начальное состояние: чекбокс — false, range — [null, null], мультивыбор —
 * пустой массив, одиночный select — «все» (ALL).
 */
export const defaultFilterValues: Record<string, FilterValue> = Object.fromEntries(
    indexFilters.map((filter) => [
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
export const isFilterActive = (filter: IndexFilter, value: FilterValue): boolean => {
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
 * options — разрешённый список опций (getOptions(indices) ?? options) для перевода
 * value → подпись.
 */
export const filterChipLabel = (
    filter: IndexFilter,
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
    if (Array.isArray(value))
        return `${filter.label}: ${(value as string[]).map(labelOf).join(', ')}`;
    return `${filter.label}: ${labelOf(value)}`;
};
