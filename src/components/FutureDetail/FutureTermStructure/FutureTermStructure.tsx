'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton, Table, TableProps, Tag } from 'antd';
import { useFutureTermStructure } from '@/hooks/useFutures';
import { IFuture } from '@models/marketFuture';
import { formatPercent, intToGrouped, intToRubCompact } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/dateUtils';
import style from './style.module.scss';

interface FutureTermStructureProps {
    /** Код базового актива — объединяет все серии контракта. */
    assetCode: string;
    /** SECID текущего (открытого) контракта — подсвечиваем в списке. */
    currentSecid: string;
}

const changeClass = (percent: number) => {
    if (percent > 0) return style.up;
    if (percent < 0) return style.down;
    return style.flat;
};

/**
 * Срочная структура актива: все контракты одного ASSETCODE по датам исполнения.
 * Показывает, как рынок оценивает контракт с более дальней экспирацией (контанго/
 * бэквордация), и даёт быстро переключиться на другую серию.
 */
const FutureTermStructure: React.FC<FutureTermStructureProps> = ({ assetCode, currentSecid }) => {
    const router = useRouter();
    const { data: contracts = [], isLoading } = useFutureTermStructure(assetCode);

    if (isLoading) {
        return <Skeleton active paragraph={{ rows: 4 }} />;
    }

    const formatPrice = (future: IFuture) =>
        future.last === null
            ? '—'
            : future.last.toLocaleString('ru-RU', {
                  minimumFractionDigits: future.decimals,
                  maximumFractionDigits: future.decimals
              });

    const columns: TableProps<IFuture>['columns'] = [
        {
            title: 'Контракт',
            dataIndex: 'shortName',
            key: 'shortName',
            render: (_, future) => (
                <span className={style.nameCell}>
                    {future.shortName}
                    {future.secid === currentSecid && (
                        <Tag className={style.current} bordered={false}>
                            текущий
                        </Tag>
                    )}
                </span>
            )
        },
        {
            title: 'Экспирация',
            dataIndex: 'expiry',
            key: 'expiry',
            render: (_, future) => (future.isPerpetual ? 'вечный' : formatDate(future.expiry))
        },
        {
            title: 'Цена',
            dataIndex: 'last',
            key: 'last',
            align: 'right',
            render: (_, future) => <span className={style.mono}>{formatPrice(future)}</span>
        },
        {
            title: 'За день',
            dataIndex: 'dayChangePercent',
            key: 'dayChangePercent',
            align: 'right',
            render: (_, future) => (
                <span className={`${style.mono} ${changeClass(future.dayChangePercent)}`}>
                    {formatPercent(future.dayChangePercent)}
                </span>
            )
        },
        {
            title: 'Откр. интерес',
            dataIndex: 'openPosition',
            key: 'openPosition',
            align: 'right',
            render: (_, future) => <span className={style.mono}>{intToGrouped(future.openPosition)}</span>
        },
        {
            title: 'Оборот',
            dataIndex: 'valToday',
            key: 'valToday',
            align: 'right',
            render: (_, future) => (
                <span className={style.mono}>
                    {future.valToday > 0 ? intToRubCompact(future.valToday) : '—'}
                </span>
            )
        }
    ];

    return (
        <section className={style.wrapper}>
            <Table<IFuture>
                columns={columns}
                dataSource={contracts}
                rowKey='id'
                pagination={false}
                size='middle'
                scroll={{ x: 'max-content' }}
                onRow={(record) => ({
                    onClick: () =>
                        record.secid !== currentSecid && router.push(`/futures/${record.secid}`)
                })}
                rowClassName={(record) =>
                    record.secid === currentSecid ? style.activeRow : style.row
                }
            />
        </section>
    );
};
export default FutureTermStructure;
