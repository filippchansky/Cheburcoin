import { IFilteredShares } from '@models/filteredShares';

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

export interface ShareFilter {
    /** Ключ во внутреннем состоянии фильтров. */
    key: string;
    /** Подпись/плейсхолдер контрола. */
    label: string;
    /**
     * Тип контрола. По умолчанию 'select'. 'checkbox' — булев вкл/выкл; 'range' —
     * числовой диапазон «от/до» (отбор по getValue в границах [от, до]).
     */
    type?: 'select' | 'checkbox' | 'range';
    /** Мультивыбор: значение — массив, отбор = бумага подходит под ЛЮБОЕ из значений. */
    multiple?: boolean;
    /** Статичные опции. Если задан getOptions — используются они. */
    options: FilterOption[];
    /** Опции, зависящие от данных (напр. список секторов). */
    getOptions?: (shares: IFilteredShares[]) => FilterOption[];
    /** Проверка бумаги против ОДНОГО выбранного значения (для select/checkbox). */
    match?: (share: IFilteredShares, value: string) => boolean;
    /** Числовой аксессор для type='range'. null = у бумаги нет значения → не в диапазоне. */
    getValue?: (share: IFilteredShares) => number | null;
    /** Суффикс единицы в range-инпутах (напр. '%'). */
    unit?: string;
    /** Шаг для range-инпутов (по умолчанию 1). */
    step?: number;
    /** Разрешить отрицательные значения в range-инпуте (для изменения за день). */
    allowNegative?: boolean;
    /** Показывать в основном ряду всегда (иначе — в панели «Все фильтры»). */
    primary?: boolean;
    /** Группа в панели расширенных фильтров. См. FILTER_GROUPS. */
    group?: string;
}

/** Смысловые группы расширенных фильтров (порядок — в SECONDARY_GROUP_ORDER). */
export const FILTER_GROUPS = {
    dividend: 'Дивиденды',
    trading: 'Цена и ликвидность'
} as const;

/** Порядок групп в панели «Все фильтры». */
export const SECONDARY_GROUP_ORDER: string[] = [FILTER_GROUPS.dividend, FILTER_GROUPS.trading];

/** Пороги тиров капитализации, ₽. */
const BILLION = 1e9;
const LARGE_CAP = 500 * BILLION;
const MID_CAP = 100 * BILLION;

/** Уникальные секторы, встречающиеся в данных (алфавит, пустые отброшены). */
const collectSectors = (shares: IFilteredShares[]): string[] => {
    const set = new Set<string>();
    shares.forEach((share) => {
        if (share.sector) set.add(share.sector);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
};

/**
 * Декларативное описание фильтров списка акций. Чтобы добавить фильтр — достаточно
 * добавить сюда одну запись (плюс, при необходимости, производный атрибут в mapShares
 * или в мёрдже на странице).
 */
export const shareFilters: ShareFilter[] = [
    {
        key: 'cap',
        label: 'Капитализация',
        primary: true,
        options: [
            { label: 'Любая капитализация', value: ALL },
            { label: 'Крупные (от 500 млрд ₽)', value: 'large' },
            { label: 'Средние (100–500 млрд ₽)', value: 'mid' },
            { label: 'Малые (до 100 млрд ₽)', value: 'small' }
        ],
        match: (share, value) => {
            if (value === 'large') return share.capitalization >= LARGE_CAP;
            if (value === 'mid')
                return share.capitalization >= MID_CAP && share.capitalization < LARGE_CAP;
            return share.capitalization < MID_CAP;
        }
    },
    {
        key: 'divYield',
        label: 'Дивдоходность, %',
        type: 'range',
        primary: true,
        unit: '%',
        step: 0.5,
        options: [],
        // Доходность к текущей цене. null у бумаг без дивидендов/данных — при заданной
        // границе они отсекаются.
        getValue: (share) => share.dividendYield ?? null
    },
    {
        key: 'sector',
        label: 'Сектор',
        primary: true,
        multiple: true,
        options: [],
        getOptions: (shares) =>
            collectSectors(shares).map((sector) => ({ label: sector, value: sector })),
        match: (share, value) => share.sector === value
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
        getValue: (share) => share.dayChangePercent
    },
    {
        key: 'onlyDividend',
        label: 'Только дивидендные',
        type: 'checkbox',
        group: FILTER_GROUPS.dividend,
        options: [],
        match: (share) => (share.annualDiv ?? 0) > 0
    },
    {
        key: 'price',
        label: 'Цена, ₽',
        type: 'range',
        group: FILTER_GROUPS.trading,
        unit: '₽',
        step: 1,
        options: [],
        getValue: (share) => share.price || null
    },
    {
        key: 'turnover',
        label: 'Оборот за день, млн ₽',
        type: 'range',
        group: FILTER_GROUPS.trading,
        unit: 'млн',
        step: 10,
        options: [],
        // Оборот в млн ₽ — вводить миллиарды рублями неудобно.
        getValue: (share) => (share.valToday > 0 ? share.valToday / 1e6 : null)
    }
];

/**
 * Начальное состояние: чекбокс — false, range — [null, null], мультивыбор — [],
 * одиночный select — «все» (ALL).
 */
export const defaultFilterValues: Record<string, FilterValue> = Object.fromEntries(
    shareFilters.map((filter) => [
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
export const isFilterActive = (filter: ShareFilter, value: FilterValue): boolean => {
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
 * options — разрешённый список (getOptions(shares) ?? options) для перевода value → подпись.
 */
export const filterChipLabel = (
    filter: ShareFilter,
    value: FilterValue,
    options: FilterOption[]
): string | null => {
    if (!isFilterActive(filter, value)) return null;
    const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

    if (filter.type === 'range') {
        const [min, max] = value as RangeValue;
        const unit = filter.unit ?? '';
        // Убираем хвост «, %» / «, ₽» / «, млн ₽» из подписи — единица уже в значении.
        const base = filter.label.replace(/,\s*[^,]+$/, '');
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
