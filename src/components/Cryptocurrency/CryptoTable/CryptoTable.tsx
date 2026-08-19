'use client';
import React from 'react';
import { Avatar, Button, Empty, Grid, Table, TableProps } from 'antd';
import { useRouter } from 'next/navigation';
import { formatAmount, formatPercent } from '@/utils/formatCurrency';
import type { ICoinMarket, VsCurrency } from '@models/crypto';
import Sparkline from './Sparkline';
import FavoriteStar from './FavoriteStar';
import style from './style.module.scss';

/** Сколько строк показываем на мобильных до нажатия «Показать ещё». */
const MOBILE_PAGE = 25;

interface CryptoTableProps {
    data: ICoinMarket[];
    loading?: boolean;
    error?: boolean;
    vs: VsCurrency;
    favorites: string[];
}

const vsCode = (vs: VsCurrency) => (vs === 'usd' ? 'USD' : 'RUB');

const changeClass = (v: number | null) => {
    if (v === null) return style.flat;
    if (v > 0) return style.up;
    if (v < 0) return style.down;
    return style.flat;
};

/** Ячейка процентного изменения: цвет по знаку, «—» для отсутствующих данных. */
const PctCell: React.FC<{ value: number | null }> = ({ value }) => (
    <span className={`${style.mono} ${changeClass(value)}`}>
        {value === null ? '—' : formatPercent(value)}
    </span>
);

const CoinName: React.FC<{ coin: ICoinMarket }> = ({ coin }) => (
    <div className='flex items-center gap-3'>
        <Avatar src={coin.icon} size={32}>
            {coin.symbol.slice(0, 3)}
        </Avatar>
        <div className='flex flex-col'>
            <span className={style.name}>{coin.name}</span>
            <span className={style.symbol}>{coin.symbol}</span>
        </div>
    </div>
);

const CryptoTable: React.FC<CryptoTableProps> = ({ data, loading, error, vs, favorites }) => {
    const router = useRouter();
    const screens = Grid.useBreakpoint();
    const isMobile = screens.md === false;
    const [visible, setVisible] = React.useState(MOBILE_PAGE);
    const code = vsCode(vs);
    const favSet = React.useMemo(() => new Set(favorites), [favorites]);

    const columns: TableProps<ICoinMarket>['columns'] = [
        {
            title: '',
            key: 'favorite',
            width: 44,
            render: (_, coin) => (
                <FavoriteStar coinId={coin.id} isFavorite={favSet.has(coin.id)} />
            )
        },
        {
            title: '#',
            dataIndex: 'rank',
            key: 'rank',
            width: 56,
            align: 'right',
            render: (_, { rank }) => <span className={style.muted}>{rank ?? '—'}</span>,
            sorter: (a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9)
        },
        {
            title: 'Монета',
            key: 'name',
            width: 190,
            render: (_, coin) => <CoinName coin={coin} />
        },
        {
            title: 'Цена',
            dataIndex: 'price',
            key: 'price',
            align: 'right',
            width: 118,
            render: (_, { price }) => (
                <span className={style.mono}>{formatAmount(price, code)}</span>
            ),
            sorter: (a, b) => a.price - b.price
        },
        {
            title: '1ч',
            dataIndex: 'priceChange1h',
            key: 'priceChange1h',
            align: 'right',
            width: 82,
            render: (_, { priceChange1h }) => <PctCell value={priceChange1h} />,
            sorter: (a, b) => (a.priceChange1h ?? 0) - (b.priceChange1h ?? 0)
        },
        {
            title: '24ч',
            dataIndex: 'priceChange24h',
            key: 'priceChange24h',
            align: 'right',
            width: 82,
            render: (_, { priceChange24h }) => <PctCell value={priceChange24h} />,
            sorter: (a, b) => (a.priceChange24h ?? 0) - (b.priceChange24h ?? 0)
        },
        {
            title: '7д',
            dataIndex: 'priceChange7d',
            key: 'priceChange7d',
            align: 'right',
            width: 82,
            render: (_, { priceChange7d }) => <PctCell value={priceChange7d} />,
            sorter: (a, b) => (a.priceChange7d ?? 0) - (b.priceChange7d ?? 0)
        },
        {
            title: 'Объём 24ч',
            dataIndex: 'volume',
            key: 'volume',
            align: 'right',
            width: 124,
            render: (_, { volume }) => (
                <span className={style.mono}>
                    {volume === null ? '—' : formatAmount(volume, code, { compact: true })}
                </span>
            ),
            sorter: (a, b) => (a.volume ?? 0) - (b.volume ?? 0)
        },
        {
            title: 'Капитализация',
            dataIndex: 'marketCap',
            key: 'marketCap',
            align: 'right',
            width: 140,
            render: (_, { marketCap }) => (
                <span className={style.mono}>
                    {marketCap === null ? '—' : formatAmount(marketCap, code, { compact: true })}
                </span>
            ),
            defaultSortOrder: 'descend',
            sorter: (a, b) => (a.marketCap ?? 0) - (b.marketCap ?? 0)
        },
        {
            title: 'За 7 дней',
            key: 'sparkline',
            width: 120,
            align: 'right',
            render: (_, { sparkline }) => (
                <div className={style.sparkCell}>
                    <Sparkline data={sparkline} />
                </div>
            )
        }
    ];

    if (error) {
        return (
            <div className={style.wrapper}>
                <Empty description='Не удалось загрузить список монет. Попробуйте обновить страницу.' />
            </div>
        );
    }

    if (isMobile) {
        const shown = data.slice(0, visible);
        return (
            <div className={style.wrapper}>
                <div className={style.mList}>
                    {shown.map((coin) => {
                        const cls = changeClass(coin.priceChange24h);
                        return (
                            <div
                                key={coin.id}
                                className={style.mRow}
                                onClick={() => router.push(`/cryptocurrency/${coin.id}`)}
                            >
                                <Avatar src={coin.icon} size={40}>
                                    {coin.symbol.slice(0, 3)}
                                </Avatar>
                                <div className={style.mMain}>
                                    <span className={style.mName}>{coin.name}</span>
                                    <span className={style.mSub}>
                                        {coin.rank ? `#${coin.rank} · ` : ''}
                                        {coin.symbol}
                                    </span>
                                </div>
                                <div className={style.mRight}>
                                    <span className={style.mValue}>
                                        {formatAmount(coin.price, code)}
                                    </span>
                                    <span className={`${style.mSub} ${cls}`}>
                                        {coin.priceChange24h === null
                                            ? '—'
                                            : formatPercent(coin.priceChange24h)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {visible < data.length ? (
                        <Button
                            className={style.showMore}
                            block
                            onClick={() => setVisible((v) => v + MOBILE_PAGE)}
                        >
                            Показать ещё
                        </Button>
                    ) : null}
                </div>
            </div>
        );
    }

    return (
        <div className={style.wrapper}>
            <Table<ICoinMarket>
                className={style.table}
                columns={columns}
                dataSource={data}
                rowKey='id'
                loading={loading}
                sticky
                scroll={{ x: 'max-content' }}
                pagination={{ pageSize: 50, showSizeChanger: false, hideOnSinglePage: true }}
                onRow={(record) => ({
                    onClick: () => router.push(`/cryptocurrency/${record.id}`)
                })}
                rowClassName={style.row}
            />
        </div>
    );
};
export default CryptoTable;
