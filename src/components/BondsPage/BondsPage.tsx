'use client';
import React, { useMemo, useState } from 'react';
import { Alert, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useBonds, useBondFlags } from '@/hooks/useBonds';
import { defaultBondOrder } from '@/utils/bondLabels';
import { ALL, bondFilters, defaultFilterValues, FilterValue } from './bondFilters';
import BondsTable from './BondsTable/BondsTable';
import style from './style.module.scss';

const BondsPage: React.FC = () => {
    const { data: bonds = [], isLoading, isError } = useBonds();
    const { data: flags } = useBondFlags();
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<Record<string, FilterValue>>(defaultFilterValues);

    const setFilter = (key: string, value: FilterValue) =>
        setFilters((prev) => ({ ...prev, [key]: value }));

    /** Список, обогащённый признаками надёжности из статической карты по secid. */
    const bondsWithFlags = useMemo(() => {
        if (!flags) return bonds;
        return bonds.map((bond) => {
            const flag = flags[bond.secid];
            return flag
                ? {
                      ...bond,
                      forQualified: flag.qualified,
                      hasDefault: flag.hasDefault,
                      hasTechnicalDefault: flag.hasTechnicalDefault
                  }
                : bond;
        });
    }, [bonds, flags]);

    /** Видимые при текущих значениях фильтры (скрытые не влияют на отбор). */
    const visibleFilters = useMemo(
        () => bondFilters.filter((filter) => !filter.visible || filter.visible(filters)),
        [filters]
    );

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return bondsWithFlags
            .filter((bond) => {
                for (const filter of visibleFilters) {
                    const value = filters[filter.key];
                    if (Array.isArray(value)) {
                        // Мультивыбор: пусто = без ограничения; иначе — любое из выбранных.
                        if (value.length > 0 && !value.some((v) => filter.match(bond, v)))
                            return false;
                    } else if (value !== ALL && !filter.match(bond, value)) {
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
            .sort(defaultBondOrder);
    }, [bondsWithFlags, visibleFilters, filters, search]);

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
                        {visibleFilters.map((filter) => (
                            <Select
                                key={filter.key}
                                className={style.filter}
                                mode={filter.multiple ? 'multiple' : undefined}
                                placeholder={filter.label}
                                allowClear={filter.multiple}
                                maxTagCount='responsive'
                                options={filter.getOptions ? filter.getOptions(bonds) : filter.options}
                                value={filters[filter.key]}
                                onChange={(value) => setFilter(filter.key, value)}
                                popupMatchSelectWidth={false}
                            />
                        ))}
                    </div>

                    <BondsTable data={filtered} loading={isLoading} />
                </>
            )}
        </div>
    );
};
export default BondsPage;
