'use client';
import React from 'react';
import { Empty, Skeleton, Table, TableProps, Tag } from 'antd';
import { IBondCoupon } from '@models/bondDetail';
import { useBondCoupons } from '@/hooks/useBonds';
import { formatMoney } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/dateUtils';
import style from './style.module.scss';

interface CouponsTableProps {
    secid: string;
    currency: string;
}

const CouponsTable: React.FC<CouponsTableProps> = ({ secid, currency }) => {
    const { data: coupons = [], isLoading, isError } = useBondCoupons(secid);

    const nextCoupon = coupons.find((coupon) => !coupon.isPaid);

    const columns: TableProps<IBondCoupon>['columns'] = [
        {
            title: 'Дата',
            dataIndex: 'date',
            key: 'date',
            render: (_, coupon) => formatDate(coupon.date)
        },
        {
            title: 'Ставка',
            dataIndex: 'percent',
            key: 'percent',
            align: 'right',
            render: (_, coupon) => (coupon.percent === null ? '—' : `${coupon.percent.toFixed(2)}%`)
        },
        {
            title: 'Выплата',
            dataIndex: 'value',
            key: 'value',
            align: 'right',
            render: (_, coupon) => formatMoney(coupon.value, currency)
        },
        {
            title: 'Статус',
            key: 'status',
            align: 'right',
            render: (_, coupon) =>
                coupon.isPaid ? (
                    <Tag color='success' bordered={false}>Выплачен</Tag>
                ) : (
                    <Tag color='processing' bordered={false}>
                        Предстоит
                    </Tag>
                )
        }
    ];

    return (
        <section className={style.wrapper}>
            <div className={style.head}>
                <h2 className={style.title}>Купоны</h2>
                {nextCoupon && (
                    <span className={style.next}>
                        Ближайший: {formatDate(nextCoupon.date)} ·{' '}
                        {formatMoney(nextCoupon.value, currency)}
                    </span>
                )}
            </div>

            {isLoading ? (
                <Skeleton active paragraph={{ rows: 5 }} />
            ) : isError ? (
                <Empty description='Не удалось загрузить купоны' />
            ) : (
                <Table<IBondCoupon>
                    columns={columns}
                    dataSource={coupons}
                    rowKey='date'
                    size='middle'
                    scroll={{ x: 'max-content' }}
                    pagination={{ pageSize: 12, showSizeChanger: false, hideOnSinglePage: true }}
                    rowClassName={(coupon) =>
                        nextCoupon && coupon.date === nextCoupon.date ? style.highlight : ''
                    }
                />
            )}
        </section>
    );
};
export default CouponsTable;
