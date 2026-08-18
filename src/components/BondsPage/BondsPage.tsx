'use client';
import React, { useMemo, useState } from 'react';
import { Alert, Badge, Button, Checkbox, Input, InputNumber, Select, Tag } from 'antd';
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    FilterOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { useBonds, useBondFlags, useKeyRate } from '@/hooks/useBonds';
import { defaultBondOrder, isReliableBond } from '@/utils/bondLabels';
import {
    ALL,
    BondFilter,
    bondFilters,
    defaultFilterValues,
    filterChipLabel,
    FilterValue,
    isFilterActive,
    RangeValue,
    SECONDARY_GROUP_ORDER
} from './bondFilters';
import BondsTable from './BondsTable/BondsTable';
import style from './style.module.scss';

const BondsPage: React.FC = () => {
    const { data: bonds = [], isLoading, isError } = useBonds();
    const { data: flags } = useBondFlags();
    const { data: keyRate } = useKeyRate();
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<Record<string, FilterValue>>(defaultFilterValues);
    const [showAll, setShowAll] = useState(false);

    const setFilter = (key: string, value: FilterValue) =>
        setFilters((prev) => ({ ...prev, [key]: value }));
    const clearFilter = (key: string) => setFilter(key, defaultFilterValues[key]);
    const resetAll = () => setFilters(defaultFilterValues);

    /** Разрешённые опции фильтра (динамические имеют приоритет над статичными). */
    const optionsOf = (filter: BondFilter) =>
        filter.getOptions ? filter.getOptions(bonds) : filter.options;

    /**
     * Список, обогащённый признаками для фильтров: квал-флаг из статической карты по
     * secid и производный признак рыночной надёжности (цена/доходность против ключевой
     * ставки). reliable считаем всегда — при незагруженной ставке isReliableBond вернёт
     * true, и фильтр «Только надёжные» просто ничего не отсечёт.
     */
    const bondsWithFlags = useMemo(
        () =>
            bonds.map((bond) => ({
                ...bond,
                forQualified: flags?.[bond.secid]?.qualified,
                reliable: isReliableBond(bond, keyRate?.rate)
            })),
        [bonds, flags, keyRate]
    );

    /** Видимые при текущих значениях фильтры (скрытые не влияют на отбор). */
    const visibleFilters = useMemo(
        () => bondFilters.filter((filter) => !filter.visible || filter.visible(filters)),
        [filters]
    );

    /** Основные (всегда на виду) и расширенные (под кнопкой «Все фильтры»). */
    const primaryFilters = useMemo(
        () => visibleFilters.filter((filter) => filter.primary),
        [visibleFilters]
    );
    const secondaryFilters = useMemo(
        () => visibleFilters.filter((filter) => !filter.primary),
        [visibleFilters]
    );

    /**
     * Расширенные фильтры, разложенные по смысловым группам (пустые группы отброшены).
     * Фильтры без известной группы попадают в «Прочее» — чтобы новый фильтр без
     * заданного group не исчез из панели молча (при этом отбор по нему всё равно идёт).
     */
    const groups = useMemo(() => {
        const known = SECONDARY_GROUP_ORDER.map((name) => ({
            name,
            filters: secondaryFilters.filter((filter) => filter.group === name)
        }));
        const leftover = secondaryFilters.filter(
            (filter) => !filter.group || !SECONDARY_GROUP_ORDER.includes(filter.group)
        );
        if (leftover.length > 0) known.push({ name: 'Прочее', filters: leftover });
        return known.filter((group) => group.filters.length > 0);
    }, [secondaryFilters]);

    /** Сколько расширенных (скрытых) фильтров сейчас активно — для бейджа на кнопке. */
    const hiddenActiveCount = useMemo(
        () =>
            secondaryFilters.filter((filter) => isFilterActive(filter, filters[filter.key])).length,
        [secondaryFilters, filters]
    );

    /** Чипсы активных фильтров — чтобы состояние было видно даже при свёрнутой панели. */
    const activeChips = useMemo(
        () =>
            visibleFilters.flatMap((filter) => {
                const text = filterChipLabel(filter, filters[filter.key], optionsOf(filter));
                return text ? [{ key: filter.key, text }] : [];
            }),
        // optionsOf зависит от bonds; visibleFilters/filters покрывают остальное.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [visibleFilters, filters, bonds]
    );

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return (
            bondsWithFlags
                .filter((bond) => {
                    for (const filter of visibleFilters) {
                        const value = filters[filter.key];
                        if (filter.type === 'range') {
                            // Диапазон [от, до]: пустые границы не ограничивают; бумага без
                            // значения (getValue=null) отсекается, как только задана граница.
                            const [min, max] = value as RangeValue;
                            if (min !== null || max !== null) {
                                const v = filter.getValue?.(bond) ?? null;
                                if (v === null) return false;
                                if (min !== null && v < min) return false;
                                if (max !== null && v > max) return false;
                            }
                        } else if (typeof value === 'boolean') {
                            // Чекбокс: снят = без ограничения; отмечен = только подходящие.
                            if (value && !filter.match?.(bond, '')) return false;
                        } else if (Array.isArray(value)) {
                            // Мультивыбор (range уже обработан выше): пусто = без ограничения;
                            // иначе — бумага подходит под любое из выбранных значений.
                            const selected = value as string[];
                            if (
                                selected.length > 0 &&
                                !selected.some((v) => filter.match?.(bond, v))
                            )
                                return false;
                        } else if (value !== ALL && !filter.match?.(bond, value)) {
                            return false;
                        }
                    }
                    if (!query) return true;
                    return (
                        bond.shortName.toLowerCase().includes(query) ||
                        bond.isin.toLowerCase().includes(query) ||
                        bond.secid.toLowerCase().includes(query)
                    );
                })
                // Порядок по умолчанию: надёжность → доходность, без мусорных ВДО наверху.
                // Клик по заголовку колонки перекрывает этот порядок сортировкой antd.
                .sort(defaultBondOrder)
        );
    }, [bondsWithFlags, visibleFilters, filters, search]);

    /** Рендер одного контрола фильтра по его типу (общий для основного ряда и панели). */
    const renderControl = (filter: BondFilter) => {
        if (filter.type === 'range') {
            const value = filters[filter.key] as RangeValue;
            return (
                <div key={filter.key} className={style.range}>
                    <span className={style.rangeLabel}>{filter.label}</span>
                    <div className={style.rangeInputs}>
                        <InputNumber
                            className={style.rangeInput}
                            size='large'
                            min={0}
                            step={filter.step}
                            placeholder='от'
                            suffix={filter.unit}
                            value={value[0]}
                            onChange={(v) => setFilter(filter.key, [v ?? null, value[1]])}
                        />
                        <InputNumber
                            className={style.rangeInput}
                            size='large'
                            min={0}
                            step={filter.step}
                            placeholder='до'
                            suffix={filter.unit}
                            value={value[1]}
                            onChange={(v) => setFilter(filter.key, [value[0], v ?? null])}
                        />
                    </div>
                </div>
            );
        }
        if (filter.type === 'checkbox') {
            return (
                <Checkbox
                    key={filter.key}
                    className={style.checkbox}
                    checked={filters[filter.key] === true}
                    onChange={(e) => setFilter(filter.key, e.target.checked)}
                >
                    {filter.label}
                </Checkbox>
            );
        }
        return (
            <Select
                key={filter.key}
                className={style.filter}
                mode={filter.multiple ? 'multiple' : undefined}
                placeholder={filter.label}
                allowClear={filter.multiple}
                maxTagCount='responsive'
                options={optionsOf(filter)}
                value={filters[filter.key]}
                onChange={(value) => setFilter(filter.key, value)}
                popupMatchSelectWidth={false}
            />
        );
    };

    return (
        <div className={style.page}>
            <div className={style.header}>
                <div className={style.titleBlock}>
                    <h1 className={style.title}>Облигации</h1>
                    <p className={style.subtitle}>
                        {bonds.length > 0
                            ? `${bonds.length} выпусков · ОФЗ, корпоративные и муниципальные`
                            : 'Облигации Московской биржи'}
                    </p>
                </div>
                <Input
                    className={style.search}
                    allowClear
                    size='large'
                    prefix={<SearchOutlined />}
                    placeholder='Поиск по названию или ISIN'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {isError ? (
                <Alert
                    type='error'
                    showIcon
                    message='Не удалось загрузить облигации'
                    description='Проверьте соединение и попробуйте обновить страницу.'
                />
            ) : (
                <>
                    <div className={style.filters}>
                        {primaryFilters.map(renderControl)}
                        <Badge count={hiddenActiveCount} size='small'>
                            <Button
                                className={style.buttonAllFilters}
                                size='large'
                                type='primary'
                                ghost={!showAll}
                                icon={<FilterOutlined />}
                                onClick={() => setShowAll((v) => !v)}
                            >
                                Все фильтры {showAll ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                            </Button>
                        </Badge>
                    </div>

                    {showAll && (
                        <div className={style.panel}>
                            {groups.map((group) => (
                                <div key={group.name} className={style.group}>
                                    <div className={style.groupTitle}>{group.name}</div>
                                    <div className={style.groupControls}>
                                        {group.filters.map(renderControl)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeChips.length > 0 && (
                        <div className={style.chips}>
                            {activeChips.map((chip) => (
                                <Tag
                                    key={chip.key}
                                    className={style.chip}
                                    closable
                                    onClose={(e) => {
                                        e.preventDefault();
                                        clearFilter(chip.key);
                                    }}
                                >
                                    {chip.text}
                                </Tag>
                            ))}
                            <Button
                                type='link'
                                size='small'
                                className={style.resetBtn}
                                onClick={resetAll}
                            >
                                Сбросить всё
                            </Button>
                        </div>
                    )}

                    <BondsTable data={filtered} loading={isLoading} />
                </>
            )}
        </div>
    );
};
export default BondsPage;
