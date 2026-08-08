'use client';
import React, { useMemo, useState } from 'react';
import { Alert, Badge, Button, Checkbox, InputNumber, Segmented, Select, Tag } from 'antd';
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    FilterOutlined
} from '@ant-design/icons';
import {
    getTopByCap,
    getTopGainers,
    getTopLosers,
    useShares,
    useSharesMeta,
    useSectors
} from '@/hooks/useShares';
import { IFilteredShares } from '@models/filteredShares';
import { dividendYield } from '@/utils/shareCalc';
import SharesTableAntd from '../SharesTableAntd/SharesTableAntd';
import MoexHeader from './MoexHeader/MoexHeader';
import TopMovers from './TopMovers/TopMovers';
import {
    ALL,
    defaultFilterValues,
    filterChipLabel,
    FilterValue,
    isFilterActive,
    RangeValue,
    SECONDARY_GROUP_ORDER,
    ShareFilter,
    shareFilters
} from './shareFilters';
import style from './style.module.scss';

type Direction = 'all' | 'gainers' | 'losers';

const directionOptions = [
    { label: 'Все', value: 'all' },
    { label: 'Растущие', value: 'gainers' },
    { label: 'Падающие', value: 'losers' }
];

const MoexPage: React.FC = () => {
    const { data: shares = [], isLoading, isError } = useShares();
    const { data: sectorByTicker = {} } = useSectors();
    const { data: meta } = useSharesMeta();
    const [search, setSearch] = useState('');
    const [direction, setDirection] = useState<Direction>('all');
    const [filters, setFilters] = useState<Record<string, FilterValue>>(defaultFilterValues);
    const [showAll, setShowAll] = useState(false);

    const setFilter = (key: string, value: FilterValue) =>
        setFilters((prev) => ({ ...prev, [key]: value }));
    const clearFilter = (key: string) => setFilter(key, defaultFilterValues[key]);
    const resetAll = () => setFilters(defaultFilterValues);

    /** Разрешённые опции фильтра (динамические имеют приоритет над статичными). */
    const optionsOf = (filter: ShareFilter) =>
        filter.getOptions ? filter.getOptions(enriched) : filter.options;

    /**
     * Список, обогащённый сектором (useSectors) и дивидендами (useSharesMeta).
     * Дивдоходность считаем здесь от ЖИВОЙ цены — в статике лежит только годовой
     * дивиденд на акцию, поэтому доходность всегда свежая.
     */
    const enriched = useMemo<IFilteredShares[]>(
        () =>
            shares.map((share) => {
                const annualDiv = meta?.[share.ticker]?.annualDiv ?? null;
                return {
                    ...share,
                    sector: sectorByTicker[share.ticker] ?? '',
                    annualDiv,
                    dividendYield:
                        annualDiv && annualDiv > 0 ? dividendYield(annualDiv, share.price) : null
                };
            }),
        [shares, sectorByTicker, meta]
    );

    const gainers = useMemo(() => getTopGainers(enriched), [enriched]);
    const losers = useMemo(() => getTopLosers(enriched), [enriched]);
    const topCap = useMemo(() => getTopByCap(enriched), [enriched]);

    /** Основные (всегда на виду) и расширенные (под кнопкой «Все фильтры»). */
    const primaryFilters = useMemo(() => shareFilters.filter((f) => f.primary), []);
    const secondaryFilters = useMemo(() => shareFilters.filter((f) => !f.primary), []);

    /** Расширенные фильтры, разложенные по смысловым группам (пустые группы отброшены). */
    const groups = useMemo(() => {
        const known = SECONDARY_GROUP_ORDER.map((name) => ({
            name,
            filters: secondaryFilters.filter((f) => f.group === name)
        }));
        const leftover = secondaryFilters.filter(
            (f) => !f.group || !SECONDARY_GROUP_ORDER.includes(f.group)
        );
        if (leftover.length > 0) known.push({ name: 'Прочее', filters: leftover });
        return known.filter((group) => group.filters.length > 0);
    }, [secondaryFilters]);

    /** Сколько расширенных (скрытых) фильтров активно — для бейджа на кнопке. */
    const hiddenActiveCount = useMemo(
        () => secondaryFilters.filter((f) => isFilterActive(f, filters[f.key])).length,
        [secondaryFilters, filters]
    );

    /** Чипсы активных фильтров — чтобы состояние было видно и при свёрнутой панели. */
    const activeChips = useMemo(
        () =>
            shareFilters.flatMap((filter) => {
                const text = filterChipLabel(filter, filters[filter.key], optionsOf(filter));
                return text ? [{ key: filter.key, text }] : [];
            }),
        // optionsOf зависит от enriched; filters покрывает остальное.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [filters, enriched]
    );

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return enriched.filter((share) => {
            if (direction === 'gainers' && share.dayChangePercent <= 0) return false;
            if (direction === 'losers' && share.dayChangePercent >= 0) return false;

            for (const filter of shareFilters) {
                const value = filters[filter.key];
                if (filter.type === 'range') {
                    const [min, max] = value as RangeValue;
                    if (min !== null || max !== null) {
                        const v = filter.getValue?.(share) ?? null;
                        if (v === null) return false;
                        if (min !== null && v < min) return false;
                        if (max !== null && v > max) return false;
                    }
                } else if (typeof value === 'boolean') {
                    if (value && !filter.match?.(share, '')) return false;
                } else if (Array.isArray(value)) {
                    const selected = value as string[];
                    if (selected.length > 0 && !selected.some((v) => filter.match?.(share, v)))
                        return false;
                } else if (value !== ALL && !filter.match?.(share, value)) {
                    return false;
                }
            }

            if (!query) return true;
            return (
                share.ticker.toLowerCase().includes(query) ||
                share.title.toLowerCase().includes(query)
            );
        });
    }, [enriched, direction, filters, search]);

    /** Рендер одного контрола фильтра по его типу (общий для ряда и панели). */
    const renderControl = (filter: ShareFilter) => {
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
            <MoexHeader count={shares.length} search={search} onSearch={setSearch} />

            {isError ? (
                <Alert
                    type='error'
                    showIcon
                    message='Не удалось загрузить список акций'
                    description='Проверьте соединение и попробуйте обновить страницу.'
                />
            ) : (
                <>
                    <TopMovers
                        gainers={gainers}
                        losers={losers}
                        topCap={topCap}
                        loading={isLoading}
                    />

                    <div className={style.filters}>
                        <Segmented
                            options={directionOptions}
                            value={direction}
                            onChange={(value) => setDirection(value as Direction)}
                        />
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
                                Все фильтры{' '}
                                {showAll ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
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

                    <SharesTableAntd data={filtered} loading={isLoading} />
                </>
            )}
        </div>
    );
};
export default MoexPage;
