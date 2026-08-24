'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { Empty, Skeleton, Table, TableProps, Tag, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { IShareDividend } from '@models/shareDetail';
import { formatMoney } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/dateUtils';
import { annualDividendPerShare, dividendYield } from '@/utils/shareCalc';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import style from './style.module.scss';

interface DividendsProps {
    dividends: IShareDividend[];
    price: number | null;
    /** Историческая доходность на дату отсечки: дата отсечки → %|null. */
    yieldByDate: Map<string, number | null>;
    /** История дивидендов ещё грузится. */
    loading?: boolean;
    /** Нет токена Т-Банка — источник дивидендов недоступен (не «нет выплат»). */
    noToken?: boolean;
}

const yieldHint =
    'Историческая дивдоходность на момент выплаты по данным Т-Банка — к цене на ' +
    'дату отсечки, а не к текущей. Прочерк — если Т-Банк её не приводит.';

const Dividends: React.FC<DividendsProps> = ({
    dividends,
    price,
    yieldByDate,
    loading,
    noToken
}) => {
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);

    // Сумма выплат по календарным годам (для графика, старые → новые).
    const byYear = useMemo(() => {
        const map = new Map<string, number>();
        for (const d of dividends) {
            const year = d.date.slice(0, 4);
            map.set(year, (map.get(year) ?? 0) + d.value);
        }
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [dividends]);

    if (loading) {
        return (
            <section className={style.wrapper}>
                <h2 className={style.title}>Дивиденды</h2>
                <Skeleton active paragraph={{ rows: 4 }} />
            </section>
        );
    }

    if (noToken) {
        return (
            <section className={style.wrapper}>
                <h2 className={style.title}>Дивиденды</h2>
                <Empty
                    description={
                        <span>
                            История дивидендов доступна после{' '}
                            <Link href='/moex/portfolio'>подключения Т-Банка</Link>.
                        </span>
                    }
                />
            </section>
        );
    }

    if (!dividends.length) {
        return (
            <section className={style.wrapper}>
                <h2 className={style.title}>Дивиденды</h2>
                <Empty description='Компания не выплачивала дивиденды' />
            </section>
        );
    }

    const annual = annualDividendPerShare(dividends);
    const annualYield = dividendYield(annual, price);
    const currency = dividends[0]?.currency ?? 'RUB';

    const chartOptions = {
        tooltip: {
            trigger: 'axis',
            valueFormatter: (value: number) => formatMoney(value, currency)
        },
        grid: { left: 8, right: 8, bottom: 8, top: 16, containLabel: true },
        xAxis: {
            type: 'category',
            data: byYear.map(([year]) => year),
            axisLine: { lineStyle: { color: palette.border } },
            axisLabel: { color: palette.textMuted }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: palette.textMuted },
            splitLine: { lineStyle: { color: palette.border } }
        },
        series: [
            {
                type: 'bar',
                data: byYear.map(([, sum]) => Number(sum.toFixed(2))),
                itemStyle: { color: palette.primary, borderRadius: [4, 4, 0, 0] }
            }
        ]
    };

    const columns: TableProps<IShareDividend>['columns'] = [
        {
            title: 'Дата отсечки',
            dataIndex: 'date',
            key: 'date',
            render: (_, row) => formatDate(row.date)
        },
        {
            title: 'Дивиденд',
            dataIndex: 'value',
            key: 'value',
            align: 'right',
            render: (_, row) => formatMoney(row.value, row.currency)
        },
        {
            title: (
                <span className={style.yieldHead}>
                    Доходность на отсечку
                    <Tooltip title={yieldHint}>
                        <InfoCircleOutlined className={style.hint} />
                    </Tooltip>
                </span>
            ),
            key: 'yield',
            align: 'right',
            render: (_, row) => {
                const y = yieldByDate.get(row.date);
                return y == null ? '—' : `${y.toFixed(2)}%`;
            }
        }
    ];

    return (
        <section className={style.wrapper}>
            <div className={style.head}>
                <h2 className={style.title}>Дивиденды</h2>
                {annualYield !== null ? (
                    <Tag color='green' bordered={false} className={style.yieldTag}>
                        {annualYield.toFixed(2)}% годовых · {formatMoney(annual, currency)} на акцию
                    </Tag>
                ) : (
                    <span className={style.stale}>
                        Последняя выплата: {formatDate(dividends[0].date)}
                    </span>
                )}
            </div>

            <ReactECharts option={chartOptions} style={{ height: 220 }} notMerge lazyUpdate />

            <Table<IShareDividend>
                className={style.table}
                columns={columns}
                dataSource={dividends}
                rowKey='date'
                size='middle'
                scroll={{ x: 'max-content' }}
                pagination={{ pageSize: 8, showSizeChanger: false, hideOnSinglePage: true }}
            />
        </section>
    );
};
export default Dividends;
