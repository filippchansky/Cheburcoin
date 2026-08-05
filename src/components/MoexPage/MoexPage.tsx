'use client';
import React, { useMemo, useState } from 'react';
import { Alert, Segmented, Select } from 'antd';
import { SECTOR_INDICES } from '@api/moex/shares/getSectors';
import {
    getTopByCap,
    getTopGainers,
    getTopLosers,
    useSectors,
    useShares
} from '@/hooks/useShares';
import SharesTableAntd from '../SharesTableAntd/SharesTableAntd';
import MoexHeader from './MoexHeader/MoexHeader';
import TopMovers from './TopMovers/TopMovers';
import style from './style.module.scss';

type Filter = 'all' | 'gainers' | 'losers';

const filterOptions = [
    { label: 'Все', value: 'all' },
    { label: 'Растущие', value: 'gainers' },
    { label: 'Падающие', value: 'losers' }
];

const ALL_SECTORS = 'all';
const sectorOptions = [
    { label: 'Все секторы', value: ALL_SECTORS },
    ...Object.values(SECTOR_INDICES).map((label) => ({ label, value: label }))
];

const MoexPage: React.FC = () => {
    const { data: shares = [], isLoading, isError } = useShares();
    const { data: sectorByTicker = {} } = useSectors();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [sector, setSector] = useState<string>(ALL_SECTORS);

    const gainers = useMemo(() => getTopGainers(shares), [shares]);
    const losers = useMemo(() => getTopLosers(shares), [shares]);
    const topCap = useMemo(() => getTopByCap(shares), [shares]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return shares.filter((share) => {
            if (filter === 'gainers' && share.dayChangePercent <= 0) return false;
            if (filter === 'losers' && share.dayChangePercent >= 0) return false;
            if (sector !== ALL_SECTORS && sectorByTicker[share.ticker] !== sector) return false;
            if (!query) return true;
            return (
                share.ticker.toLowerCase().includes(query) ||
                share.title.toLowerCase().includes(query)
            );
        });
    }, [shares, filter, sector, sectorByTicker, search]);

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

                    <div className={style.controls}>
                        <Segmented
                            options={filterOptions}
                            value={filter}
                            onChange={(value) => setFilter(value as Filter)}
                        />
                        <Select
                            className={style.sectorSelect}
                            options={sectorOptions}
                            value={sector}
                            onChange={setSector}
                            popupMatchSelectWidth={false}
                        />
                    </div>

                    <SharesTableAntd data={filtered} loading={isLoading} />
                </>
            )}
        </div>
    );
};
export default MoexPage;
