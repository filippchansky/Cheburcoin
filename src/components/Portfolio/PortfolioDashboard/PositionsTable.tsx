'use client';
import React from 'react';
import { Button, Empty, Grid, Spin, Table, TableProps, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { IPosition } from '@models/tinkoffData';
import TableName from '@/components/TableName/TableName';
import { intToRub, formatPercent } from '@/utils/formatCurrency';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import {
    INSTRUMENT_TYPE_COLOR,
    instrumentTypeLabel,
    PORTFOLIO_INSTRUMENT_TYPES
} from '@/utils/instrumentType';
import style from './style.module.scss';

interface PositionsTableProps {
    positions: IPosition[];
    total: number;
    loading?: boolean;
}

/** Сколько карточек показываем на мобильных до нажатия «Показать ещё». */
const MOBILE_PAGE = 15;

/** Куда ведёт клик по строке (страница есть только у акций/фондов и облигаций). */
const positionHref = (position: IPosition): string | null => {
    if (!position.ticker) return null;
    if (position.instrumentType === 'bond') return `/bonds/${position.ticker}`;
    if (position.instrumentType === 'share' || position.instrumentType === 'etf') {
        return `/moex/${position.ticker}`;
    }
    return null;
};

const PositionsTable: React.FC<PositionsTableProps> = ({ positions, total, loading }) => {
    const router = useRouter();
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const screens = Grid.useBreakpoint();
    const isMobile = screens.md === false;
    const [visible, setVisible] = React.useState(MOBILE_PAGE);

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
            title: 'Тип',
            key: 'instrumentType',
            render: (_, { instrumentType }) => (
                <Tag color={INSTRUMENT_TYPE_COLOR[instrumentType]}>
                    {instrumentTypeLabel(instrumentType)}
                </Tag>
            ),
            filters: PORTFOLIO_INSTRUMENT_TYPES.map((type) => ({
                text: instrumentTypeLabel(type),
                value: type
            })),
            onFilter: (value, record) => record.instrumentType === value
        },
        {
            title: 'Кол-во',
            key: 'quantity',
            align: 'right',
            render: (_, { quantity }) => quantity
        },
        {
            title: 'Вес',
            key: 'weight',
            align: 'right',
            render: (_, { priceInPorfolio }) => {
                const weight = total > 0 ? (priceInPorfolio / total) * 100 : 0;
                return (
                    <div className={style.weightCell}>
                        <span>{weight.toFixed(1)}%</span>
                        <div
                            className={style.weightBar}
                            style={{ background: palette.border }}
                        >
                            <div
                                className={style.weightBarFill}
                                style={{
                                    width: `${Math.min(weight, 100)}%`,
                                    background: palette.primary
                                }}
                            />
                        </div>
                    </div>
                );
            },
            sorter: (a, b) => a.priceInPorfolio - b.priceInPorfolio,
            defaultSortOrder: 'descend'
        },
        {
            title: 'В портфеле',
            key: 'value',
            align: 'right',
            render: (_, { priceInPorfolio }) => intToRub(priceInPorfolio)
        },
        {
            title: 'Доходность',
            key: 'pl',
            align: 'right',
            render: (_, { expectedYieldFifo, expectedYieldPercent }) => {
                const positive = expectedYieldFifo >= 0;
                const cls = positive ? style.gain : style.loss;
                return (
                    <div className='flex flex-col'>
                        <span className={cls}>
                            {positive ? '+' : ''}
                            {intToRub(expectedYieldFifo)}
                        </span>
                        <span className={[cls, style.sub].join(' ')}>
                            {formatPercent(expectedYieldPercent ?? 0)}
                        </span>
                    </div>
                );
            },
            sorter: (a, b) => a.expectedYieldFifo - b.expectedYieldFifo
        },
        {
            title: 'За день',
            key: 'daily',
            align: 'right',
            render: (_, { dailyYield }) => {
                const positive = (dailyYield ?? 0) >= 0;
                return (
                    <span className={positive ? style.gain : style.loss}>
                        {positive ? '+' : ''}
                        {intToRub(dailyYield ?? 0)}
                    </span>
                );
            },
            sorter: (a, b) => (a.dailyYield ?? 0) - (b.dailyYield ?? 0)
        },
        {
            title: 'Цена',
            key: 'price',
            align: 'right',
            render: (_, { averagePositionPrice, currentPrice }) => (
                <div className='flex flex-col'>
                    <span>{intToRub(currentPrice)}</span>
                    <span className={style.sub} style={{ color: palette.textMuted }}>
                        {intToRub(averagePositionPrice)}
                    </span>
                </div>
            )
        }
    ];

    if (!positions.length) {
        return loading ? (
            <div className='text-center py-6'>
                <Spin />
            </div>
        ) : (
            <Empty description='Нет позиций' />
        );
    }

    if (isMobile) {
        // По убыванию веса — как defaultSortOrder таблицы на десктопе.
        const sorted = [...positions].sort((a, b) => b.priceInPorfolio - a.priceInPorfolio);
        const shown = sorted.slice(0, visible);
        return (
            <div className={style.cardList}>
                {shown.map((position) => {
                    const href = positionHref(position);
                    const weight = total > 0 ? (position.priceInPorfolio / total) * 100 : 0;
                    const plPositive = position.expectedYieldFifo >= 0;
                    const plCls = plPositive ? style.gain : style.loss;
                    const dayPositive = (position.dailyYield ?? 0) >= 0;
                    return (
                        <div
                            key={position.positionUid}
                            className={`${style.card} ${href ? style.cardClickable : ''}`}
                            style={{ background: palette.containerBg, borderColor: palette.border }}
                            onClick={() => href && router.push(href)}
                        >
                            <div className={style.cardHead}>
                                <TableName
                                    icon={position.isin ?? ''}
                                    ticker={position.ticker ?? ''}
                                    title={position.name ?? ''}
                                />
                                <Tag
                                    color={INSTRUMENT_TYPE_COLOR[position.instrumentType]}
                                    style={{ marginInlineEnd: 0 }}
                                >
                                    {instrumentTypeLabel(position.instrumentType)}
                                </Tag>
                            </div>

                            <div className={style.weightCell} style={{ minWidth: 0 }}>
                                <span style={{ fontSize: 12, color: palette.textMuted }}>
                                    Вес {weight.toFixed(1)}%
                                </span>
                                <div className={style.weightBar} style={{ background: palette.border }}>
                                    <div
                                        className={style.weightBarFill}
                                        style={{ width: `${Math.min(weight, 100)}%`, background: palette.primary }}
                                    />
                                </div>
                            </div>

                            <div className={style.cardMetrics}>
                                <div className={style.metric}>
                                    <span className={style.metricLabel}>В портфеле</span>
                                    <span className={style.metricValue}>
                                        {intToRub(position.priceInPorfolio)}
                                    </span>
                                </div>
                                <div className={style.metric}>
                                    <span className={style.metricLabel}>Доходность</span>
                                    <span className={`${style.metricValue} ${plCls}`}>
                                        {plPositive ? '+' : ''}
                                        {intToRub(position.expectedYieldFifo)}
                                    </span>
                                    <span className={`${style.metricSub} ${plCls}`}>
                                        {formatPercent(position.expectedYieldPercent ?? 0)}
                                    </span>
                                </div>
                                <div className={style.metric}>
                                    <span className={style.metricLabel}>За день</span>
                                    <span className={`${style.metricValue} ${dayPositive ? style.gain : style.loss}`}>
                                        {dayPositive ? '+' : ''}
                                        {intToRub(position.dailyYield ?? 0)}
                                    </span>
                                </div>
                                <div className={style.metric}>
                                    <span className={style.metricLabel}>Цена</span>
                                    <span className={style.metricValue}>{intToRub(position.currentPrice)}</span>
                                    <span className={style.metricSub} style={{ color: palette.textMuted }}>
                                        средняя {intToRub(position.averagePositionPrice)}
                                    </span>
                                </div>
                                <div className={style.metric}>
                                    <span className={style.metricLabel}>Кол-во</span>
                                    <span className={style.metricValue}>{position.quantity}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {visible < sorted.length ? (
                    <Button className={style.showMore} block onClick={() => setVisible((v) => v + MOBILE_PAGE)}>
                        Показать ещё
                    </Button>
                ) : null}
            </div>
        );
    }

    return (
        <Table<IPosition>
            loading={loading}
            columns={columns}
            dataSource={positions}
            rowKey='positionUid'
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 15, showSizeChanger: false, hideOnSinglePage: true }}
            rowClassName={(record) => (positionHref(record) ? style.clickableRow : '')}
            onRow={(record) => ({
                onClick: () => {
                    const href = positionHref(record);
                    if (href) router.push(href);
                }
            })}
        />
    );
};
export default PositionsTable;
