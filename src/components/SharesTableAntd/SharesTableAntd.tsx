'use client';
import { IFilteredShares } from '@models/filteredShares';
import { Empty, Table, TableProps, Tooltip } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import React from 'react';
import { formatPercent, intToRub } from '@/utils/formatCurrency';
import { isDividendYieldOutlier } from '@/utils/shareCalc';
import TableName from '../TableName/TableName';
import style from './style.module.scss';

interface SharesTableAntdProps {
    data: IFilteredShares[];
    loading?: boolean;
    error?: boolean;
}

const dayChangeClass = (percent: number) => {
    if (percent > 0) return style.up;
    if (percent < 0) return style.down;
    return style.flat;
};

const SharesTableAntd: React.FC<SharesTableAntdProps> = ({ data, loading, error }) => {
    const router = useRouter();

    const columns: TableProps<IFilteredShares>['columns'] = [
        {
            title: 'Наименование',
            dataIndex: 'title',
            key: 'title',
            fixed: 'left',
            width: 180,
            render: (_, { title, ticker, icon }) => (
                <TableName icon={icon} ticker={ticker} title={title} />
            )
        },
        {
            title: 'Цена',
            dataIndex: 'price',
            key: 'price',
            align: 'right',
            width: 110,
            render: (_, { price }) => <span className={style.mono}>{intToRub(price)}</span>,
            sorter: (a, b) => a.price - b.price
        },
        {
            title: 'За день',
            dataIndex: 'dayChangePercent',
            key: 'dayChangePercent',
            align: 'right',
            width: 120,
            render: (_, { dayChange, dayChangePercent }) => (
                <div className={`${style.dayChange} ${dayChangeClass(dayChangePercent)}`}>
                    <span className={style.dayChangeRub}>
                        {dayChange > 0 ? '+' : ''}
                        {intToRub(dayChange)}
                    </span>
                    <span className={style.dayChangePct}>{formatPercent(dayChangePercent)}</span>
                </div>
            ),
            sorter: (a, b) => a.dayChangePercent - b.dayChangePercent
        },
        {
            title: 'Минимум',
            dataIndex: 'lowPrice',
            key: 'lowPrice',
            align: 'right',
            width: 110,
            render: (_, { lowPrice }) => <span className={style.mono}>{intToRub(lowPrice)}</span>
        },
        {
            title: 'Максимум',
            dataIndex: 'highPrice',
            key: 'highPrice',
            align: 'right',
            width: 110,
            render: (_, { highPrice }) => <span className={style.mono}>{intToRub(highPrice)}</span>
        },
        {
            title: 'Дивдоходность',
            dataIndex: 'dividendYield',
            key: 'dividendYield',
            align: 'right',
            width: 140,
            render: (_, { dividendYield }) => {
                if (!dividendYield || dividendYield <= 0)
                    return <span className={style.muted}>—</span>;
                if (isDividendYieldOutlier(dividendYield))
                    return (
                        <Tooltip title='Аномально высокая доходность — вероятно сплит акций или разовый спецдивиденд. Историю выплат MOEX не корректирует на сплиты.'>
                            <span className={style.outlierYield}>
                                {dividendYield.toFixed(2)}% <WarningOutlined />
                            </span>
                        </Tooltip>
                    );
                return <span className={style.mono}>{dividendYield.toFixed(2)}%</span>;
            },
            sorter: (a, b) => (a.dividendYield ?? -1) - (b.dividendYield ?? -1)
        },
        {
            title: 'Капитализация',
            dataIndex: 'capitalization',
            key: 'capitalization',
            align: 'right',
            width: 160,
            render: (_, { capitalization }) => (
                <span className={style.mono}>{intToRub(capitalization)}</span>
            ),
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.capitalization - b.capitalization
        }
    ];

    if (error) {
        return (
            <div className={style.wrapper}>
                <Empty description='Не удалось загрузить список акций. Попробуйте обновить страницу.' />
            </div>
        );
    }

    return (
        <div className={style.wrapper}>
            <Table<IFilteredShares>
                className={style.table}
                columns={columns}
                dataSource={data}
                rowKey='id'
                loading={loading}
                sticky
                scroll={{ x: 'max-content' }}
                pagination={{ pageSize: 25, showSizeChanger: false, hideOnSinglePage: true }}
                onRow={(record) => ({
                    onClick: () => router.push(`/moex/${record.ticker}`)
                })}
                rowClassName={style.row}
            />
        </div>
    );
};
export default SharesTableAntd;
