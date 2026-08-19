'use client';
import React, { useMemo, useState } from 'react';
import { Alert, Input, Segmented } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useCryptoMarkets } from '@/hooks/useCrypto';
import { useFavorites } from '@/hooks/useFavorites';
import { useVsCurrency } from '@/store/vsCurrency';
import type { VsCurrency } from '@models/crypto';
import CryptoMarketBar from './CryptoMarketBar/CryptoMarketBar';
import CryptoTable from './CryptoTable/CryptoTable';
import style from './style.module.scss';

type View = 'all' | 'favorites';

const CryptoPage: React.FC = () => {
    const { vs, setVs } = useVsCurrency();
    const { data: coins = [], isLoading, isError } = useCryptoMarkets(vs);
    const { data: favorites = [] } = useFavorites();
    const [search, setSearch] = useState('');
    const [view, setView] = useState<View>('all');

    const favSet = useMemo(() => new Set(favorites), [favorites]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return coins.filter((coin) => {
            if (view === 'favorites' && !favSet.has(coin.id)) return false;
            if (!query) return true;
            return (
                coin.name.toLowerCase().includes(query) ||
                coin.symbol.toLowerCase().includes(query) ||
                coin.id.toLowerCase().includes(query)
            );
        });
    }, [coins, view, favSet, search]);

    return (
        <div className={style.page}>
            <div className={style.header}>
                <div className={style.titleBlock}>
                    <h1 className={style.title}>Криптовалюты</h1>
                    <p className={style.subtitle}>Топ монет по капитализации · данные CoinGecko</p>
                </div>
                <Input
                    className={style.search}
                    allowClear
                    size='large'
                    prefix={<SearchOutlined />}
                    placeholder='Поиск по названию или тикеру'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {isError ? (
                <Alert
                    type='error'
                    showIcon
                    message='Не удалось загрузить крипторынок'
                    description='Проверьте соединение и попробуйте обновить страницу.'
                />
            ) : (
                <>
                    <CryptoMarketBar vs={vs} />

                    <div className={style.toolbar}>
                        <Segmented<View>
                            value={view}
                            onChange={setView}
                            options={[
                                { label: 'Все', value: 'all' },
                                { label: 'Избранное', value: 'favorites' }
                            ]}
                        />
                        <Segmented<VsCurrency>
                            value={vs}
                            onChange={setVs}
                            options={[
                                { label: '$', value: 'usd' },
                                { label: '₽', value: 'rub' }
                            ]}
                        />
                    </div>

                    <CryptoTable
                        data={filtered}
                        loading={isLoading}
                        vs={vs}
                        favorites={favorites}
                    />
                </>
            )}
        </div>
    );
};
export default CryptoPage;
