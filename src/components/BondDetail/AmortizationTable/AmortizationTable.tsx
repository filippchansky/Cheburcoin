'use client';
import React from 'react';
import { Table, TableProps, Tag } from 'antd';
import { IBondAmortization } from '@models/bondDetail';
import { formatMoney } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/dateUtils';
import style from './style.module.scss';

interface AmortizationTableProps {
    amortizations: IBondAmortization[];
    currency: string;
}

/**
 * Секция «Амортизация номинала». Рендерится только когда у бумаги есть частичные
 * погашения (для bullet-облигаций список пуст и секция не показывается).
 */
const AmortizationTable: React.FC<AmortizationTableProps> = ({ amortizations, currency }) => {
    if (amortizations.length === 0) return null;

    const next = amortizations.find((item) => !item.isPaid);
    const repaid = amortizations
        .filter((item) => item.isPaid)
        .reduce((sum, item) => sum + item.percent, 0);

    const columns: TableProps<IBondAmortization>['columns'] = [
        {
            title: 'Дата',
            dataIndex: 'date',
            key: 'date',
            render: (_, item) => formatDate(item.date)
        },
        {
            title: 'Доля номинала',
            dataIndex: 'percent',
            key: 'percent',
            align: 'right',
            render: (_, item) => `${item.percent.toFixed(2)}%`
        },
        {
            title: 'Погашение',
            dataIndex: 'value',
            key: 'value',
            align: 'right',
            render: (_, item) => formatMoney(item.value, currency)
        },
        {
            title: 'Статус',
            key: 'status',
            align: 'right',
            render: (_, item) =>
                item.isPaid ? (
                    <Tag color='success' bordered={false}>
                        Погашено
                    </Tag>
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
                <h2 className={style.title}>Амортизация номинала</h2>
                <span className={style.note}>
                    Номинал гасится частями до даты погашения
                    {repaid > 0 ? ` · уже погашено ${repaid.toFixed(0)}%` : ''}
                </span>
            </div>

            <Table<IBondAmortization>
                columns={columns}
                dataSource={amortizations}
                rowKey='date'
                size='middle'
                scroll={{ x: 'max-content' }}
                pagination={{ pageSize: 12, showSizeChanger: false, hideOnSinglePage: true }}
                rowClassName={(item) => (next && item.date === next.date ? style.highlight : '')}
            />
        </section>
    );
};
export default AmortizationTable;
