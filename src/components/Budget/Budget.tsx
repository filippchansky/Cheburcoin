'use client';
import React from 'react';
import { Button, Empty, Popconfirm, Segmented, Space, Spin, Tooltip, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, TagsOutlined } from '@ant-design/icons';
import { BudgetCategory, BudgetTx, sumTotals } from '@/lib/budget/types';
import { useBudgetCategories, useBudgetTransactions, useDeleteBudgetTx } from '@/hooks/useBudget';
import { formatAmount, intToRub } from '@/utils/formatCurrency';
import { formatDayWeekday, formatMonthTitle } from '@/utils/dateUtils';
import {
    MonthGroupedList,
    NEGATIVE_COLOR,
    POSITIVE_COLOR
} from '@/components/Portfolio/PortfolioDashboard/PaymentsList';
import TransactionDrawer from './TransactionDrawer';
import BudgetSummary from './BudgetSummary';
import CategoriesDrawer from './CategoriesDrawer';

const { Title, Text } = Typography;

type BudgetView = 'list' | 'summary';

/** Рублёвый вклад операции в итог месяца: доход «+», расход «−». */
const signedRub = (tx: BudgetTx) => (tx.type === 'income' ? tx.amount : -tx.amount);

/** Одна плитка сводки (доход/расход/баланс) за всё время. */
const StatTile: React.FC<{ label: string; value: number; color?: string }> = ({
    label,
    value,
    color
}) => (
    <div
        className='flex flex-1 flex-col gap-1 rounded-lg p-3'
        style={{ background: 'rgba(127,127,127,0.08)' }}
    >
        <Text type='secondary' className='text-xs'>
            {label}
        </Text>
        <Text strong style={{ fontSize: 18, color }}>
            {formatAmount(value, 'RUB', { digits: 0 })}
        </Text>
    </div>
);

/**
 * Раздел «Бюджет» — ручной учёт расходов/доходов. Сводка за всё время сверху,
 * ниже — лента операций, сгруппированная по месяцам (общий MonthGroupedList, как
 * в «Выплатах»): в липкой шапке месяца доход/расход и итоговый баланс. Шаг 4
 * добавит пончик по категориям.
 */
const Budget: React.FC = () => {
    const { data: txs, isLoading } = useBudgetTransactions();
    const { data: categories } = useBudgetCategories();
    const deleteTx = useDeleteBudgetTx();

    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [catsOpen, setCatsOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<BudgetTx | null>(null);
    const [view, setView] = React.useState<BudgetView>('list');

    const catById = React.useMemo(() => {
        const map = new Map<string, BudgetCategory>();
        (categories ?? []).forEach((c) => map.set(c.id, c));
        return map;
    }, [categories]);

    const totals = React.useMemo(() => sumTotals(txs ?? []), [txs]);

    const openNew = () => {
        setEditing(null);
        setDrawerOpen(true);
    };
    const openEdit = (tx: BudgetTx) => {
        setEditing(tx);
        setDrawerOpen(true);
    };

    const renderRow = (tx: BudgetTx) => {
        const cat = catById.get(tx.categoryId);
        const income = tx.type === 'income';
        return (
            <div
                className='flex items-center gap-3 border-b px-3.5 py-3 last:border-b-0'
                style={{ borderColor: 'rgba(127,127,127,0.12)' }}
            >
                <span style={{ fontSize: 20 }}>{cat?.icon ?? '❓'}</span>
                <div className='flex min-w-0 flex-1 flex-col'>
                    <Text ellipsis>{cat?.name ?? 'Без категории'}</Text>
                    <Text type='secondary' className='text-xs'>
                        {formatDayWeekday(tx.date)}
                        {tx.note ? ` · ${tx.note}` : ''}
                    </Text>
                </div>
                <Text
                    strong
                    style={{
                        color: income ? POSITIVE_COLOR : NEGATIVE_COLOR,
                        fontVariantNumeric: 'tabular-nums'
                    }}
                >
                    {formatAmount(signedRub(tx), 'RUB', { signed: true })}
                </Text>
                <div className='flex'>
                    <Tooltip title='Изменить'>
                        <Button
                            type='text'
                            size='small'
                            icon={<EditOutlined />}
                            onClick={() => openEdit(tx)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title='Удалить операцию?'
                        okText='Удалить'
                        cancelText='Отмена'
                        okButtonProps={{ danger: true }}
                        onConfirm={() => deleteTx.mutate(tx.id)}
                    >
                        <Button type='text' size='small' icon={<DeleteOutlined />} />
                    </Popconfirm>
                </div>
            </div>
        );
    };

    return (
        <div className='flex flex-col gap-4 py-4'>
            <div className='flex items-center justify-between'>
                <Title level={3} style={{ margin: 0 }}>
                    Бюджет
                </Title>
                <Space>
                    <Tooltip title='Категории'>
                        <Button icon={<TagsOutlined />} onClick={() => setCatsOpen(true)} />
                    </Tooltip>
                    <Button type='primary' icon={<PlusOutlined />} onClick={openNew}>
                        Добавить
                    </Button>
                </Space>
            </div>

            <Segmented<BudgetView>
                value={view}
                onChange={setView}
                options={[
                    { label: 'Операции', value: 'list' },
                    { label: 'Сводка', value: 'summary' }
                ]}
            />

            {isLoading ? (
                <div className='py-10 text-center'>
                    <Spin />
                </div>
            ) : view === 'summary' ? (
                <BudgetSummary txs={txs ?? []} categories={categories ?? []} />
            ) : !txs?.length ? (
                <Empty
                    description='Операций пока нет'
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className='py-10'
                >
                    <Button type='primary' icon={<PlusOutlined />} onClick={openNew}>
                        Добавить первую
                    </Button>
                </Empty>
            ) : (
                <>
                    <div className='flex gap-2'>
                        <StatTile label='Доход' value={totals.income} color={POSITIVE_COLOR} />
                        <StatTile label='Расход' value={totals.expense} color={NEGATIVE_COLOR} />
                        <StatTile
                            label='Баланс'
                            value={totals.balance}
                            color={totals.balance >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR}
                        />
                    </div>
                    <MonthGroupedList<BudgetTx>
                    items={txs}
                    monthKey={(tx) => tx.date.slice(0, 7)}
                    rubAmount={signedRub}
                    rowKey={(tx) => tx.id}
                    renderRow={renderRow}
                    renderMonthHead={(group) => {
                        const m = sumTotals(group.items);
                        const positive = m.balance >= 0;
                        return (
                            <>
                                <div className='flex min-w-0 flex-col'>
                                    <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>
                                        {formatMonthTitle(group.key)}
                                    </span>
                                    <span
                                        className='mt-0.5 flex gap-3 text-xs'
                                        style={{ fontVariantNumeric: 'tabular-nums' }}
                                    >
                                        <span style={{ color: POSITIVE_COLOR }}>
                                            ↑ {intToRub(m.income)}
                                        </span>
                                        <span style={{ color: NEGATIVE_COLOR }}>
                                            ↓ {intToRub(m.expense)}
                                        </span>
                                    </span>
                                </div>
                                <span
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        padding: '3px 10px',
                                        borderRadius: 8,
                                        whiteSpace: 'nowrap',
                                        fontVariantNumeric: 'tabular-nums',
                                        color: positive ? POSITIVE_COLOR : NEGATIVE_COLOR,
                                        background: positive
                                            ? 'rgba(27,175,122,0.12)'
                                            : 'rgba(226,75,74,0.12)'
                                    }}
                                >
                                    {positive ? '+' : ''}
                                    {intToRub(m.balance)}
                                </span>
                            </>
                        );
                    }}
                    />
                </>
            )}

            <TransactionDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                editing={editing}
            />
            <CategoriesDrawer open={catsOpen} onClose={() => setCatsOpen(false)} />
        </div>
    );
};
export default Budget;
