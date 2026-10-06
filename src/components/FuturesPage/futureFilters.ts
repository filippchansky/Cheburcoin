import { IFuture, FutureGroup } from '@models/marketFuture';
import { FUTURE_GROUP_LABEL } from '@api/moex/futures/futureGroup';

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

export interface FutureFilter {
    /** Ключ во внутреннем состоянии фильтров. */
    key: string;
    /** Подпись/плейсхолдер контрола. */
    label: string;
    /** Тип контрола. По умолчанию 'select'. */
    type?: 'select' | 'checkbox' | 'range';
    /** Мультивыбор: значение — массив, отбор = контракт подходит под ЛЮБОЕ из значений. */
    multiple?: boolean;
    /** Статичные опции. */
    options: FilterOption[];
    /** Опции, зависящие от данных. */
    getOptions?: (futures: IFuture[]) => FilterOption[];
    /** Проверка контракта против ОДНОГО выбранного значения (для select/checkbox). */
    match?: (future: IFuture, value: string) => boolean;
    /** Числовой аксессор для type='range'. null = у контракта нет значения → вне диапазона. */
    getValue?: (future: IFuture) => number | null;
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

/** Опции групп фьючерсов (фиксированный осмысленный порядок). */
const GROUP_OPTIONS: FilterOption[] = (
    ['currency', 'index', 'commodity', 'stock', 'rate', 'crypto'] as FutureGroup[]
).map((group) => ({ label: FUTURE_GROUP_LABEL[group], value: group }));

/**
 * Декларативное описание фильтров списка фьючерсов.
 * Новый фильтр — одна запись здесь (плюс, при необходимости, поле в mapFutures).
 */
export const futureFilters: FutureFilter[] = [
    {
        key: 'group',
        label: 'Группа',
        primary: true,
        multiple: true,
        options: GROUP_OPTIONS,
        match: (future, value) => future.group === value
    },
    {
        key: 'perpetual',
        label: 'Только вечные',
        type: 'checkbox',
        primary: true,
        options: [],
        match: (future) => future.isPerpetual
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
        getValue: (future) => future.dayChangePercent
    },
    {
        key: 'openPosition',
        label: 'Открытый интерес, от',
        type: 'range',
        group: FILTER_GROUPS.params,
        step: 1000,
        options: [],
        getValue: (future) => future.openPosition
    }
];

/**
 * Начальное состояние: чекбокс — false, range — [null, null], мультивыбор —
 * пустой массив, одиночный select — «все» (ALL).
 */
export const defaultFilterValues: Record<string, FilterValue> = Object.fromEntries(
    futureFilters.map((filter) => [
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
export const isFilterActive = (filter: FutureFilter, value: FilterValue): boolean => {
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
 * options — разрешённый список опций (getOptions(futures) ?? options) для перевода
 * value → подпись.
 */
export const filterChipLabel = (
    filter: FutureFilter,
    value: FilterValue,
    options: FilterOption[]
): string | null => {
    if (!isFilterActive(filter, value)) return null;
    const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

    if (filter.type === 'range') {
        const [min, max] = value as RangeValue;
        const unit = filter.unit ?? '';
        const base = filter.label.replace(/,\s*%$/, '').replace(/,\s*от$/, '');
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
