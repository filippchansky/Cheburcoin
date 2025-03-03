import { IFilteredShares } from '@models/filteredShares';
import { Space, Table, TableProps, Tag } from 'antd';
import style from './style.module.scss';
import React from 'react';
import { getPercentageChange, intToRub } from '@/utils/formatCurrency';
import Image from 'next/image';
import TableName from '../TableName/TableName';

interface SharesTableAntdProps {
    data: IFilteredShares[];
}

interface IRowsData extends Omit<IFilteredShares, 'lowPrice' | 'highPrice'> {
    lowPrice: string;
    highPrice: string;
    icon: string;
    dayDiff: number;
}

const SharesTableAntd: React.FC<SharesTableAntdProps> = ({ data }) => {
    const columns: TableProps<IRowsData>['columns'] = [
        {
            title: 'Наименование',
            dataIndex: 'name',
            key: 'name',
            render: (_, { title, ticker, icon }) => (
                <TableName icon={icon} ticker={ticker} title={title} />
            )
        },
        {
            title: 'Цена',
            dataIndex: 'price',
            key: 'price',
            render: (_, { price }) => (
                <>
                    <p>{intToRub(price)}</p>
                </>
            ),
            sorter: (a, b) => a.price - b.price
        },
        {
            title: 'Цена открытия',
            dataIndex: 'openPrice',
            key: 'openPrice',
            render: (_, { openPrice }) => <p>{intToRub(openPrice)}</p>
        },
        {
            title: 'Минимум',
            key: 'lowPrice',
            dataIndex: 'lowPrice'
            // render: (_, { tags }) => <></>
        },
        {
            title: 'Максимум',
            key: 'highPrice',
            dataIndex: 'highPrice'
        },
        {
            title: 'За день',
            key: 'dayDiff',
            dataIndex: 'dayDiff',
            render: (_, { dayDiff, price, openPrice }) => {
                const formate = dayDiff > 0 ? '+' + intToRub(dayDiff) : intToRub(dayDiff);
                return (
                    <div className='flex flex-col gap-2'>
                        <h3
                            className={
                                dayDiff > 0 ? style.title : [style.title, style.red].join(' ')
                            }
                            // style={{ color: `${dayDiff > 0 ? '#96ff7f' : 'red'}` }}
                        >
                            {formate}
                        </h3>
                        <p
                            className={
                                dayDiff > 0 ? style.percent : [style.percent, style.red].join(' ')
                            }
                        >
                            {getPercentageChange(price, openPrice)}
                        </p>
                    </div>
                );
            }
        },
        {
            title: 'Капитализация',
            key: 'capitalization',
            dataIndex: 'capitalization',
            render: (_, { capitalization }) => <p>{intToRub(capitalization)}</p>,
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.capitalization - b.capitalization
        }
    ];

    const rows: IRowsData[] = data?.map((item) => ({
        id: item.id,
        ticker: item.ticker,
        title: item.title,
        price: item.price,
        capitalization: item.capitalization,
        openPrice: item.openPrice,
        lowPrice: intToRub(item.lowPrice),
        highPrice: intToRub(item.highPrice),
        dayDiff: item.price - item.openPrice,
        icon: item.icon
    }));

    return (
        <div className={style.wrapper}>
            <Table<IRowsData> columns={columns} dataSource={rows} rowKey={'id'} />
        </div>
    );
};
export default SharesTableAntd;
