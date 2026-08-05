import { IBond } from '@models/bond';

export const ALL = 'all';

interface FilterOption {
    label: string;
    value: string;
}

export interface BondFilter {
    /** Ключ во внутреннем состоянии фильтров. */
    key: string;
    /** Подпись/плейсхолдер селекта. */
    label: string;
    options: FilterOption[];
    /** Проверка бумаги против выбранного значения (вызывается только когда value !== ALL). */
    match: (bond: IBond, value: string) => boolean;
}

/**
 * Декларативное описание фильтров списка облигаций.
 * Чтобы добавить новый фильтр — достаточно добавить сюда одну запись
 * (плюс, при необходимости, производный атрибут в mapBonds).
 */
export const bondFilters: BondFilter[] = [
    {
        key: 'couponType',
        label: 'Тип купона',
        options: [
            { label: 'Любой купон', value: ALL },
            { label: 'Фиксированный', value: 'fixed' },
            { label: 'Плавающий', value: 'floating' },
            { label: 'Инфляционный', value: 'inflation' }
        ],
        match: (bond, value) => bond.couponType === value
    },
    {
        key: 'amortization',
        label: 'Амортизация',
        options: [
            { label: 'Амортизация: любая', value: ALL },
            { label: 'С амортизацией', value: 'yes' },
            { label: 'Без амортизации', value: 'no' }
        ],
        match: (bond, value) => (value === 'yes' ? bond.hasAmortization : !bond.hasAmortization)
    },
    {
        key: 'offer',
        label: 'Оферта',
        options: [
            { label: 'Оферта: любая', value: ALL },
            { label: 'С офертой', value: 'yes' },
            { label: 'Без оферты', value: 'no' }
        ],
        match: (bond, value) => (value === 'yes' ? bond.hasOffer : !bond.hasOffer)
    }
];

/** Начальное состояние: у каждого фильтра выбрано «все». */
export const defaultFilterValues: Record<string, string> = Object.fromEntries(
    bondFilters.map((filter) => [filter.key, ALL])
);
