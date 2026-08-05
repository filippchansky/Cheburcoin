'use client';
import React, { useMemo, useState } from 'react';
import { Alert, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useOfzBonds } from '@/hooks/useBonds';
import { ALL, bondFilters, defaultFilterValues } from './bondFilters';
import BondsTable from './BondsTable/BondsTable';
import style from './style.module.scss';

const BondsPage: React.FC = () => {
    const { data: bonds = [], isLoading, isError } = useOfzBonds();
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<Record<string, string>>(defaultFilterValues);

    const setFilter = (key: string, value: string) =>
        setFilters((prev) => ({ ...prev, [key]: value }));

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return bonds.filter((bond) => {
            for (const filter of bondFilters) {
                const value = filters[filter.key];
                if (value !== ALL && !filter.match(bond, value)) return false;
            }
            if (!query) return true;
            return (
                bond.shortName.toLowerCase().includes(query) ||
                bond.isin.toLowerCase().includes(query) ||
                bond.secid.toLowerCase().includes(query)
            );
        });
    }, [bonds, filters, search]);

    return (
        <div className={style.page}>
            <div className={style.header}>
                <div className={style.titleBlock}>
                    <h1 className={style.title}>Облигации · ОФЗ</h1>
                    <p className={style.subtitle}>
                        {bonds.length > 0 ? `${bonds.length} гособлигаций` : 'Государственные облигации'}
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
                        {bondFilters.map((filter) => (
                            <Select
                                key={filter.key}
                                className={style.filter}
                                options={filter.options}
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
