import React from 'react';
import style from './style.module.scss';
import { useQuery } from '@tanstack/react-query';
import { getPortfolio } from '@api/tinkoff/getPortfolio/getPortfolio';
import { IPosition } from '@models/tinkoffData';
import { Table, TableProps } from 'antd';
import TableName from '@/components/TableName/TableName';
import { intToRub } from '@/utils/formatCurrency';
import { useRouter } from 'next/navigation';

interface PortfolioItemProps {
    account: string;
}

const PortfolioItem: React.FC<PortfolioItemProps> = ({ account }) => {
    const router = useRouter();
    const { data, isLoading } = useQuery({
        queryKey: ['account', account],
        queryFn: () => getPortfolio(account)
    });

    const columns: TableProps<IPosition>['columns'] = [
        {
            title: 'Наименование',
            dataIndex: 'name',
            key: 'name',
            render: (_, { ticker, name, isin }) => (
                <TableName icon={isin ?? ''} ticker={ticker ?? ''} title={name ?? ''} />
            )
        },
        {
            title: 'Кол-во',
            key: 'quantity',
            render: (_, { quantity }) => <p>{quantity}</p>
        },
        {
            title: 'В портфеле',
            key: 'allBuy',
            render: (_, { priceInPorfolio, expectedYieldFifo }) => {
                const isPositive = expectedYieldFifo > 0;
                return (
                    <div className='flex flex-col'>
                        <p>{intToRub(priceInPorfolio)}</p>
                        <p
                            className={
                                isPositive ? style.price : [style.price, style.red].join(' ')
                            }
                        >
                            {isPositive
                                ? '+' + intToRub(expectedYieldFifo)
                                : intToRub(expectedYieldFifo)}
                        </p>
                    </div>
                );
            },
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.priceInPorfolio - b.priceInPorfolio
        },
        {
            title: 'Цена (покупка)',
            dataIndex: 'buyPrice',
            key: 'buyPrice',
            render: (_, { averagePositionPrice }) => <p>{intToRub(averagePositionPrice)}</p>,
        },
        {
            title: 'Цена (текущая)',
            dataIndex: 'currentPrice',
            key: 'currentPrice',
            render: (_, { currentPrice }) => <p>{intToRub(currentPrice)}</p>
        }
    ];

    console.log(data);

    // if (isLoading) {
    //     return <>загрузка...</>;
    // }

    const rowData = data?.positions?.filter((item) => item.ticker);

    return (
        <>
            {data?.name}
            <Table<IPosition> loading={isLoading} columns={columns} dataSource={rowData} rowKey={'positionUid'} />
        </>
    );
};
export default PortfolioItem;
