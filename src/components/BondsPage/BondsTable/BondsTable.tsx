'use client';
import React from 'react';
import { Empty, Table, TableProps, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { IBond } from '@models/bond';
import { formatMoney } from '@/utils/formatCurrency';
import { formatDate, yearsUntil } from '@/utils/dateUtils';
import { couponTag } from '@/utils/bondLabels';
import style from './style.module.scss';

interface BondsTableProps {
    data: IBond[];
    loading?: boolean;
    error?: boolean;
}

const num = (value: number | null, digits = 2) => (value === null ? '—' : value.toFixed(digits));

const columns: TableProps<IBond>['columns'] = [
    {
        title: 'Название',
        dataIndex: 'shortName',
        key: 'shortName',
        fixed: 'left',
        render: (_, bond) => (
            <div className={style.name}>
                <span className={style.nameTitle}>{bond.shortName}</span>
                <span className={style.tags}>
                    <Tag color={couponTag[bond.couponType].color} bordered={false}>
                        {couponTag[bond.couponType].label}
                    </Tag>
                    {bond.hasAmortization && (
                        <Tag color='purple' bordered={false}>
                            Аморт.
                        </Tag>
                    )}
                    {bond.hasOffer && (
                        <Tag color='volcano' bordered={false}>
                            Оферта
                        </Tag>
                    )}
                </span>
            </div>
        )
    },
    {
        title: 'Цена',
        dataIndex: 'pricePercent',
        key: 'pricePercent',
        align: 'right',
        render: (_, bond) => (
            <div className={style.cell}>
                <span className={style.strong}>{num(bond.pricePercent)}%</span>
                {bond.priceValue !== null && (
                    <span className={style.muted}>{formatMoney(bond.priceValue, bond.currency)}</span>
                )}
            </div>
        ),
        sorter: (a, b) => (a.pricePercent ?? 0) - (b.pricePercent ?? 0)
    },
    {
        title: 'Доходность',
        dataIndex: 'yield',
        key: 'yield',
        align: 'right',
        render: (_, bond) => <span className={style.strong}>{num(bond.yield)}%</span>,
        defaultSortOrder: 'descend',
        sorter: (a, b) => (a.yield ?? 0) - (b.yield ?? 0)
    },
    {
        title: 'Текущая доходность',
        dataIndex: 'couponYieldToPrice',
        key: 'couponYieldToPrice',
        align: 'right',
        render: (_, bond) => (
            <div className={style.cell}>
                <span className={style.strong}>{num(bond.couponYieldToPrice)}%</span>
                {bond.couponYieldToNominal !== null && (
                    <span className={style.muted}>
                        {bond.couponYieldToNominal.toFixed(2)}% к номин.
                    </span>
                )}
            </div>
        ),
        sorter: (a, b) => (a.couponYieldToPrice ?? 0) - (b.couponYieldToPrice ?? 0)
    },
    {
        title: 'Купон',
        dataIndex: 'couponPercent',
        key: 'couponPercent',
        align: 'right',
        render: (_, bond) =>
            bond.couponPercent === null ? (
                <span className={style.muted}>плавающий</span>
            ) : (
                <span>{bond.couponPercent.toFixed(2)}%</span>
            ),
        sorter: (a, b) => (a.couponPercent ?? 0) - (b.couponPercent ?? 0)
    },
    {
        title: 'Погашение',
        dataIndex: 'maturityDate',
        key: 'maturityDate',
        align: 'right',
        render: (_, bond) => {
            const years = yearsUntil(bond.maturityDate);
            return (
                <div className={style.cell}>
                    <span>{formatDate(bond.maturityDate)}</span>
                    {years !== null && (
                        <span className={style.muted}>через {years.toFixed(1)} г.</span>
                    )}
                </div>
            );
        },
        sorter: (a, b) => a.maturityDate.localeCompare(b.maturityDate)
    },
    {
        title: 'Дюрация',
        dataIndex: 'duration',
        key: 'duration',
        align: 'right',
        render: (_, bond) =>
            bond.duration === null ? '—' : <span>{(bond.duration / 365).toFixed(1)} г.</span>,
        sorter: (a, b) => (a.duration ?? 0) - (b.duration ?? 0)
    },
    {
        title: 'НКД',
        dataIndex: 'accruedInt',
        key: 'accruedInt',
        align: 'right',
        render: (_, bond) => (
            <span className={style.muted}>{formatMoney(bond.accruedInt, bond.currency)}</span>
        )
    }
];

const BondsTable: React.FC<BondsTableProps> = ({ data, loading, error }) => {
    const router = useRouter();

    if (error) {
        return <Empty description='Не удалось загрузить облигации. Попробуйте обновить страницу.' />;
    }

    return (
        <Table<IBond>
            columns={columns}
            dataSource={data}
            rowKey='id'
            loading={loading}
            sticky
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 25, showSizeChanger: false, hideOnSinglePage: true }}
            onRow={(bond) => ({ onClick: () => router.push(`/bonds/${bond.secid}`) })}
            rowClassName={style.row}
        />
    );
};
export default BondsTable;
