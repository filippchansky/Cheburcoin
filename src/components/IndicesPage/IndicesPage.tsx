'use client';
import React, { useMemo, useState } from 'react';
import { useTableUrlState } from '@/hooks/useTableUrlState';
import { Alert, Badge, Button, Checkbox, Input, InputNumber, Select, Tag } from 'antd';
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    FilterOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { useIndices } from '@/hooks/useIndices';
import { IndexGroup } from '@models/marketIndex';
import {
    ALL,
    defaultFilterValues,
    FilterValue,
    filterChipLabel,
    IndexFilter,
    indexFilters,
    isFilterActive,
    RangeValue,
    SECONDARY_GROUP_ORDER
} from './indexFilters';
import IndicesTable from './IndicesTable/IndicesTable';
import style from './style.module.scss';

/** Порядок групп в списке по умолчанию: широкий рынок сверху, ставки РЕПО — ниже. */
const GROUP_ORDER: Record<IndexGroup, number> = {
    main: 0,
    sector: 1,
    bonds: 2,
    money: 3,
    other: 4
};

const IndicesPage: React.FC = () => {
    const { data: indices = [], isLoading, isError } = useIndices();

    // Поиск/фильтры/страница живут в URL — «Назад» возвращает те же фильтры и позицию.
    const { search, setSearch, page, setPage, filters, setFilter, clearFilter, resetAll } =
        useTableUrlState<IndexFilter, FilterValue>(
            indexFilters,
            defaultFilterValues,
            isFilterActive
        );
    const [showAll, setShowAll] = useState(false);

    /** Разрешённые опции фильтра (динамические имеют приоритет над статичными). */
    const optionsOf = (filter: IndexFilter) =>
        filter.getOptions ? filter.getOptions(indices) : filter.options;

    /** Основные (всегда на виду) и расширенные (под кнопкой «Все фильтры»). */
    const primaryFilters = useMemo(() => indexFilters.filter((filter) => filter.primary), []);
    const secondaryFilters = useMemo(() => indexFilters.filter((filter) => !filter.primary), []);

    /** Расширенные фильтры по смысловым группам (пустые группы отброшены). */
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
            indexFilters.flatMap((filter) => {
                const text = filterChipLabel(filter, filters[filter.key], optionsOf(filter));
                return text ? [{ key: filter.key, text }] : [];
            }),
        // optionsOf зависит от indices; filters покрывает остальное.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [filters, indices]
    );

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return indices
            .filter((index) => {
                for (const filter of indexFilters) {
                    const value = filters[filter.key];
                    if (filter.type === 'range') {
                        // Диапазон [от, до]: пустые границы не ограничивают; индекс без
                        // значения (getValue=null) отсекается, как только задана граница.
                        const [min, max] = value as RangeValue;
                        if (min !== null || max !== null) {
                            const v = filter.getValue?.(index) ?? null;
                            if (v === null) return false;
                            if (min !== null && v < min) return false;
                            if (max !== null && v > max) return false;
                        }
                    } else if (typeof value === 'boolean') {
                        if (value && !filter.match?.(index, '')) return false;
                    } else if (Array.isArray(value)) {
                        // Мультивыбор: пусто = без ограничения; иначе — любое из выбранных.
                        const selected = value as string[];
                        if (selected.length > 0 && !selected.some((v) => filter.match?.(index, v)))
                            return false;
                    } else if (value !== ALL && !filter.match?.(index, value)) {
                        return false;
                    }
                }
                if (!query) return true;
                return (
                    index.shortName.toLowerCase().includes(query) ||
                    index.name.toLowerCase().includes(query) ||
                    index.secid.toLowerCase().includes(query)
                );
            })
            // По умолчанию — по значимости группы (широкий рынок сверху), внутри группы
            // самые активные выше. Клик по заголовку колонки перекрывает сортировкой antd.
            .sort(
                (a, b) =>
                    GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || b.valToday - a.valToday
            );
    }, [indices, filters, search]);

    /** Рендер одного контрола фильтра по его типу (общий для ряда и панели). */
    const renderControl = (filter: IndexFilter) => {
        if (filter.type === 'range') {
            const value = filters[filter.key] as RangeValue;
            return (
                <div key={filter.key} className={style.range}>
                    <span className={style.rangeLabel}>{filter.label}</span>
                    <div className={style.rangeInputs}>
                        <InputNumber
                            className={style.rangeInput}
                            size='large'
                            min={filter.allowNegative ? undefined : 0}
                            step={filter.step}
                            placeholder='от'
                            suffix={filter.unit}
                            value={value[0]}
                            onChange={(v) => setFilter(filter.key, [v ?? null, value[1]])}
                        />
                        <InputNumber
                            className={style.rangeInput}
                            size='large'
                            min={filter.allowNegative ? undefined : 0}
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
                    <h1 className={style.title}>Индексы</h1>
                    <p className={style.subtitle}>
                        {indices.length > 0
                            ? `${indices.length} индексов Московской биржи`
                            : 'Индексы Московской биржи'}
                    </p>
                </div>
                <Input
                    className={style.search}
                    allowClear
                    size='large'
                    prefix={<SearchOutlined />}
                    placeholder='Поиск по коду или названию'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {isError ? (
                <Alert
                    type='error'
                    showIcon
                    message='Не удалось загрузить индексы'
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

                    <IndicesTable
                        data={filtered}
                        loading={isLoading}
                        page={page}
                        onPageChange={setPage}
                    />
                </>
            )}
        </div>
    );
};
export default IndicesPage;
