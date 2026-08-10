'use client';
import React from 'react';
import { Alert, Button, Empty, Skeleton, Table, TableProps, Tooltip } from 'antd';
import { InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useRouter } from 'next/navigation';
import { IPosition } from '@models/tinkoffData';
import { EnrichedCoupon, useCoupons } from '@/hooks/useCoupons';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { intToRub } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/dateUtils';
import TableName from '@/components/TableName/TableName';

interface CouponCalendarProps {
    /** Облигационные позиции (обычно агрегат по всем счетам). */
    bondPositions: IPosition[];
}

const CouponCalendar: React.FC<CouponCalendarProps> = ({ bondPositions }) => {
    const { events, byMonth, total12m, hasNonRub, status, isFetching, refetch } =
        useCoupons(bondPositions);
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const router = useRouter();

    if (status === 'empty') {
        return <Empty description='В портфеле нет облигаций — купонов не ожидается' />;
    }

    if (status === 'loading') {
        return (
            <div>
                <Skeleton.Node active style={{ width: '100%', height: 84 }}>
                    <span />
                </Skeleton.Node>
                <Skeleton active paragraph={{ rows: 6 }} className='mt-5' />
            </div>
        );
    }

    if (status === 'error') {
        return (
            <Alert
                type='error'
                showIcon
                message='Не удалось загрузить календарь купонов'
                description='Проверьте подключение к сети или обновите.'
                action={
                    <Button size='small' onClick={refetch}>
                        Повторить
                    </Button>
                }
            />
        );
    }

    if (!events.length) {
        return <Empty description='Нет предстоящих купонов в ближайшие 12 месяцев' />;
    }

    const chartOption = {
        grid: { top: 16, right: 12, bottom: 24, left: 8, containLabel: true },
        tooltip: {
            trigger: 'axis',
            formatter: (params: { name: string; value: number }[]) =>
                `${params[0].name}<br/>${intToRub(params[0].value)}`
        },
        xAxis: {
            type: 'category',
            data: byMonth.map((bucket) => bucket.label),
            axisLabel: { color: palette.textMuted, fontSize: 11 },
            axisLine: { lineStyle: { color: palette.border } }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: palette.textMuted,
                fontSize: 11,
                formatter: (value: number) => new Intl.NumberFormat('ru-RU', {
                    notation: 'compact',
                    maximumFractionDigits: 1
                }).format(value)
            },
            splitLine: { lineStyle: { color: palette.border, opacity: 0.4 } }
        },
        series: [
            {
                type: 'bar',
                data: byMonth.map((bucket) => bucket.amount),
                itemStyle: { color: '#1baf7a', borderRadius: [4, 4, 0, 0] },
                barMaxWidth: 36
            }
        ]
    };

    const columns: TableProps<EnrichedCoupon>['columns'] = [
        {
            title: 'Дата выплаты',
            key: 'couponDate',
            render: (_, { couponDate }) => formatDate(couponDate?.slice(0, 10)),
            sorter: (a, b) => a.couponDate.localeCompare(b.couponDate),
            defaultSortOrder: 'ascend'
        },
        {
            title: 'Облигация',
            key: 'name',
            render: (_, { ticker, name, isin }) => (
                <TableName icon={isin ?? ''} ticker={ticker ?? ''} title={name ?? ''} />
            )
        },
        {
            title: (
                <span>
                    Отсечка{' '}
                    <Tooltip title='После этой даты покупка облигации уже не даёт права на купон'>
                        <InfoCircleOutlined style={{ color: palette.textMuted }} />
                    </Tooltip>
                </span>
            ),
            key: 'fixDate',
            render: (_, { fixDate }) => formatDate(fixDate?.slice(0, 10))
        },
        {
            title: 'Кол-во',
            key: 'quantity',
            align: 'right',
            render: (_, { quantity }) => quantity
        },
        {
            title: 'Сумма',
            key: 'amount',
            align: 'right',
            render: (_, { amount, currency }) =>
                currency && !['rub', 'sur', 'RUB', 'SUR'].includes(currency)
                    ? `${amount.toFixed(2)} ${currency.toUpperCase()}`
                    : intToRub(amount),
            sorter: (a, b) => a.amount - b.amount
        }
    ];

    return (
        <div>
            <div className='flex items-center justify-between gap-3 mb-4 flex-wrap'>
                <div
                    style={{
                        background: palette.containerBg,
                        border: `1px solid ${palette.border}`,
                        borderRadius: 12,
                        padding: '14px 16px'
                    }}
                >
                    <div style={{ fontSize: 13, color: palette.textMuted, marginBottom: 6 }}>
                        Купоны за 12 месяцев · до налога
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color: '#1baf7a' }}>
                        {intToRub(total12m)}
                    </div>
                </div>
                <Button icon={<ReloadOutlined spin={isFetching} />} onClick={refetch}>
                    Обновить
                </Button>
            </div>

            {hasNonRub ? (
                <Alert
                    type='info'
                    showIcon
                    className='mb-4'
                    message='В портфеле есть облигации в иностранной валюте — их купоны не вошли в рублёвый итог и график.'
                />
            ) : null}

            <div className='mb-5'>
                <ReactECharts option={chartOption} style={{ height: 220 }} notMerge lazyUpdate />
            </div>

            <Table<EnrichedCoupon>
                columns={columns}
                dataSource={events}
                rowKey={(record) => `${record.instrumentId}-${record.couponNumber}-${record.couponDate}`}
                scroll={{ x: 'max-content' }}
                pagination={{ pageSize: 15, showSizeChanger: false, hideOnSinglePage: true }}
            />
        </div>
    );
};
export default CouponCalendar;
