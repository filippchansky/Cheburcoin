import { IBond } from '@models/bond';
import { BOND_SECTOR_OTHER } from '@api/moex/bonds/bondSectors';
import { bondStructure } from '@/utils/bondLabels';

export const ALL = 'all';

/** Значение одного фильтра: строка (одиночный выбор) или массив (мультивыбор). */
export type FilterValue = string | string[];

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
    /** Проверка бумаги против ОДНОГО выбранного значения. */
    match: (bond: IBond, value: string) => boolean;
}

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
        options: [
            { label: 'Дефолт: любой', value: ALL },
            { label: 'Без дефолтных', value: 'no' },
            { label: 'Только дефолтные', value: 'yes' }
        ],
        match: (bond, value) =>
            value === 'yes' ? bond.hasDefault === true : bond.hasDefault !== true
    }
];

/** Начальное состояние: одиночные — «все» (ALL), мультивыбор — пустой массив. */
export const defaultFilterValues: Record<string, FilterValue> = Object.fromEntries(
    bondFilters.map((filter) => [filter.key, filter.multiple ? [] : ALL])
);
