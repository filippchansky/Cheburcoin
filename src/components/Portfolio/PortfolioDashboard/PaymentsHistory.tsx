'use client';
import React from 'react';
import { Alert, Button, Empty, Grid, Segmented, Skeleton, Table, TableProps, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { IPaymentItem, PaymentCategory } from '@models/tinkoffData';
import { usePayments } from '@/hooks/usePayments';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { intToRub } from '@/utils/formatCurrency';
import { formatDate, formatDayWeekday, formatMonthTitle } from '@/utils/dateUtils';
import cardStyle from './style.module.scss';

/** Сколько выплат показываем на мобильных до нажатия «Показать ещё». */
const MOBILE_PAGE = 20;

/** Группирует выплаты по месяцу со знаковым итогом группы (налоги — в минус). */
const groupByMonth = (items: IPaymentItem[]) => {
    const groups: { key: string; total: number; items: IPaymentItem[] }[] = [];
    const index = new Map<string, number>();
    items.forEach((item) => {
        const key = item.date.slice(0, 7);
        let gi = index.get(key);
        if (gi === undefined) {
            gi = groups.length;
            index.set(key, gi);
            groups.push({ key, total: 0, items: [] });
        }
        groups[gi].items.push(item);
        if (!item.currency || ['rub', 'sur', 'RUB', 'SUR'].includes(item.currency)) {
            groups[gi].total += item.payment;
        }
    });
    return groups;
};

const formatPaymentAmount = (payment: number, currency: string | null) =>
    currency && !['rub', 'sur', 'RUB', 'SUR'].includes(currency)
        ? `${payment.toFixed(2)} ${currency.toUpperCase()}`
        : intToRub(payment);

const PERIOD_OPTIONS = [
    { label: '6 мес', value: 6 },
    { label: '12 мес', value: 12 },
    { label: '24 мес', value: 24 }
];

const CATEGORY_META: Record<PaymentCategory, { label: string; color: string }> = {
    coupon: { label: 'Купон', color: 'green' },
    dividend: { label: 'Дивиденд', color: 'blue' },
    repayment: { label: 'Погашение', color: 'purple' },
    tax: { label: 'Налог', color: 'red' },
    other: { label: 'Прочее', color: 'default' }
};

interface MiniStatProps {
    label: string;
    value: string;
    color?: string;
    bg: string;
    border: string;
    muted: string;
}

const MiniStat: React.FC<MiniStatProps> = ({ label, value, color, bg, border, muted }) => (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ fontSize: 13, color: muted, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color: color ?? 'inherit' }}>{value}</div>
    </div>
);

const PaymentsHistory: React.FC = () => {
    const [months, setMonths] = React.useState<number>(12);
    const { items, byMonth, totalNet, totalGross, totalTax, hasNonRub, status, isFetching, refetchAll } =
        usePayments(months);
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const screens = Grid.useBreakpoint();
    const isMobile = screens.md === false;
    const [visible, setVisible] = React.useState(MOBILE_PAGE);
    const [categories, setCategories] = React.useState<PaymentCategory[]>([]);

    /** Типы выплат, реально встречающиеся в периоде — только их показываем в фильтре. */
    const presentCategories = React.useMemo(
        () => (Object.keys(CATEGORY_META) as PaymentCategory[]).filter((c) => items.some((i) => i.category === c)),
        [items]
    );

    React.useEffect(() => setVisible(MOBILE_PAGE), [months, categories]);

    const periodSwitch = (
        <Segmented<number>
            options={PERIOD_OPTIONS}
            value={months}
            onChange={setMonths}
            disabled={status === 'loading'}
        />
    );

    if (status === 'empty') {
        return <Empty description='Подключите счёт Т-Банка, чтобы увидеть историю выплат' />;
    }

    if (status === 'error') {
        return (
            <Alert
                type='error'
                showIcon
                message='Не удалось загрузить историю выплат'
                description='Проверьте подключение к сети или обновите.'
                action={
                    <Button size='small' onClick={refetchAll}>
                        Повторить
                    </Button>
                }
            />
        );
    }

    /** Мобильный список фильтруется по выбранным типам (пусто = показываем все). */
    const filteredItems = categories.length ? items.filter((i) => categories.includes(i.category)) : items;

    const chartOption = {
        grid: {
            top: 16,
            right: isMobile ? 6 : 12,
            bottom: 24,
            left: isMobile ? 4 : 8,
            containLabel: true
        },
        tooltip: {
            trigger: 'axis',
            formatter: (params: { name: string; value: number }[]) =>
                `${params[0].name}<br/>${intToRub(params[0].value)}`
        },
        xAxis: {
            type: 'category',
            data: byMonth.map((bucket) => bucket.label),
            axisLabel: {
                color: palette.textMuted,
                fontSize: 11,
                // На мобилках оставляем только месяц без года: «авг. 2026 г.» → «авг.»
                formatter: isMobile ? (value: string) => value.split(' ')[0] : undefined
            },
            axisLine: { lineStyle: { color: palette.border } }
        },
        yAxis: {
            type: 'value',
            // На мобилках убираем колонку сумм слева, чтобы график занял всю ширину.
            axisLabel: {
                show: !isMobile,
                color: palette.textMuted,
                fontSize: 11,
                formatter: (value: number) =>
                    new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
            },
            splitLine: { lineStyle: { color: palette.border, opacity: 0.4 } }
        },
        series: [
            {
                type: 'bar',
                data: byMonth.map((bucket) => ({
                    value: bucket.amount,
                    itemStyle: { color: bucket.amount >= 0 ? '#1baf7a' : '#e24b4a', borderRadius: [4, 4, 0, 0] }
                })),
                barMaxWidth: 36
            }
        ]
    };

    const columns: TableProps<IPaymentItem>['columns'] = [
        {
            title: 'Дата',
            key: 'date',
            render: (_, { date }) => formatDate(date?.slice(0, 10)),
            sorter: (a, b) => a.date.localeCompare(b.date),
            defaultSortOrder: 'descend'
        },
        {
            title: 'Инструмент',
            key: 'name',
            render: (_, { name }) => name ?? '—'
        },
        {
            title: 'Тип',
            key: 'category',
            render: (_, { category }) => (
                <Tag color={CATEGORY_META[category].color}>{CATEGORY_META[category].label}</Tag>
            ),
            filters: (Object.keys(CATEGORY_META) as PaymentCategory[]).map((key) => ({
                text: CATEGORY_META[key].label,
                value: key
            })),
            onFilter: (value, record) => record.category === value
        },
        {
            title: 'Сумма',
            key: 'payment',
            align: 'right',
            render: (_, { payment, currency }) => {
                const positive = payment >= 0;
                return (
                    <span style={{ color: positive ? '#1baf7a' : '#e24b4a' }}>
                        {positive ? '+' : ''}
                        {formatPaymentAmount(payment, currency)}
                    </span>
                );
            },
            sorter: (a, b) => a.payment - b.payment
        }
    ];

    return (
        <div>
            <div className='flex items-center justify-between gap-3 mb-4 flex-wrap'>
                {periodSwitch}
                <Button icon={<ReloadOutlined spin={isFetching} />} onClick={refetchAll}>
                    Обновить
                </Button>
            </div>

            {status === 'loading' ? (
                <div>
                    <Skeleton.Node active style={{ width: '100%', height: 84 }}>
                        <span />
                    </Skeleton.Node>
                    <Skeleton active paragraph={{ rows: 6 }} className='mt-5' />
                </div>
            ) : (
                <>
                    <div
                        className='grid gap-3 mb-5'
                        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}
                    >
                        <MiniStat
                            label='Получено чистыми'
                            value={intToRub(totalNet)}
                            color='#1baf7a'
                            bg={palette.containerBg}
                            border={palette.border}
                            muted={palette.textMuted}
                        />
                        <MiniStat
                            label='Начислено (до налога)'
                            value={intToRub(totalGross)}
                            bg={palette.containerBg}
                            border={palette.border}
                            muted={palette.textMuted}
                        />
                        <MiniStat
                            label='Удержано налога'
                            value={intToRub(totalTax)}
                            color={totalTax > 0 ? '#e24b4a' : undefined}
                            bg={palette.containerBg}
                            border={palette.border}
                            muted={palette.textMuted}
                        />
                    </div>

                    {hasNonRub ? (
                        <Alert
                            type='info'
                            showIcon
                            className='mb-4'
                            message='Есть выплаты в иностранной валюте — они не вошли в рублёвый итог и график.'
                        />
                    ) : null}

                    {items.length ? (
                        <>
                            <div className='mb-5'>
                                <ReactECharts option={chartOption} style={{ height: 220 }} notMerge lazyUpdate />
                            </div>
                            {isMobile ? (
                                <>
                                    {presentCategories.length > 1 ? (
                                        <div className='flex flex-wrap gap-2 mb-4'>
                                            {presentCategories.map((c) => (
                                                <Tag.CheckableTag
                                                    key={c}
                                                    checked={categories.includes(c)}
                                                    onChange={(checked) =>
                                                        setCategories((prev) =>
                                                            checked
                                                                ? [...prev, c]
                                                                : prev.filter((x) => x !== c)
                                                        )
                                                    }
                                                >
                                                    {CATEGORY_META[c].label}
                                                </Tag.CheckableTag>
                                            ))}
                                        </div>
                                    ) : null}

                                    {filteredItems.length ? (
                                        <div
                                            className={cardStyle.payList}
                                            style={{
                                                ['--rowBorder' as string]: palette.border,
                                                ['--rowBg' as string]: palette.layoutBg
                                            }}
                                        >
                                            {groupByMonth(
                                                [...filteredItems]
                                                    .sort((a, b) => b.date.localeCompare(a.date))
                                                    .slice(0, visible)
                                            ).map((group) => {
                                        const groupPositive = group.total >= 0;
                                        return (
                                            <React.Fragment key={group.key}>
                                                <div className={cardStyle.monthHead}>
                                                    <span className={cardStyle.monthName}>
                                                        {formatMonthTitle(group.key)}
                                                    </span>
                                                    <span
                                                        className={cardStyle.monthTotal}
                                                        style={{
                                                            color: groupPositive ? '#1baf7a' : '#e24b4a',
                                                            background: groupPositive
                                                                ? 'rgba(27,175,122,0.12)'
                                                                : 'rgba(226,75,74,0.12)'
                                                        }}
                                                    >
                                                        {groupPositive ? '+' : ''}
                                                        {intToRub(group.total)}
                                                    </span>
                                                </div>
                                                {group.items.map((item) => {
                                                    const positive = item.payment >= 0;
                                                    return (
                                                        <div key={item.id} className={cardStyle.payRow}>
                                                            <div className={cardStyle.payHead}>
                                                                <span className={cardStyle.payDate}>
                                                                    📅 {formatDayWeekday(item.date)}
                                                                </span>
                                                                <Tag
                                                                    color={CATEGORY_META[item.category].color}
                                                                    style={{ marginInlineEnd: 0 }}
                                                                >
                                                                    {CATEGORY_META[item.category].label}
                                                                </Tag>
                                                            </div>
                                                            <div className={cardStyle.payBody}>
                                                                <div className={cardStyle.payInfo}>
                                                                    <span className={cardStyle.payName}>
                                                                        {item.name ?? '—'}
                                                                    </span>
                                                                </div>
                                                                <div className={cardStyle.payAmount}>
                                                                    <span
                                                                        className={cardStyle.payAmountValue}
                                                                        style={{
                                                                            color: positive ? '#1baf7a' : '#e24b4a'
                                                                        }}
                                                                    >
                                                                        {positive ? '+' : ''}
                                                                        {formatPaymentAmount(item.payment, item.currency)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                            })}
                                            {visible < filteredItems.length ? (
                                                <Button
                                                    className={cardStyle.showMore}
                                                    block
                                                    onClick={() => setVisible((v) => v + MOBILE_PAGE)}
                                                >
                                                    Показать ещё
                                                </Button>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <Empty description='Нет выплат выбранного типа' />
                                    )}
                                </>
                            ) : (
                                <Table<IPaymentItem>
                                    columns={columns}
                                    dataSource={items}
                                    rowKey='id'
                                    scroll={{ x: 'max-content' }}
                                    pagination={{ pageSize: 15, showSizeChanger: false, hideOnSinglePage: true }}
                                />
                            )}
                        </>
                    ) : (
                        <Empty description='За выбранный период выплат не было' />
                    )}
                </>
            )}
        </div>
    );
};
export default PaymentsHistory;
