'use client';
import React from 'react';
import { Alert, Button, Segmented, Skeleton, Tabs } from 'antd';
import {
    ReloadOutlined,
    DashboardOutlined,
    PieChartOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useSectors } from '@/hooks/useShares';
import { useBondSectorMap, useBondRatings } from '@/hooks/useBonds';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { intToRub, formatPercent } from '@/utils/formatCurrency';
import {
    PortfolioScope,
    scopeFromAggregate,
    scopeFromPortfolio
} from '@/utils/portfolioScope';
import { AllocationMode, buildAllocation } from '@/utils/portfolioAllocation';
import { usePortfolioPrefs } from '@/store/portfolioPrefs';
import { usePaymentsBreakdown } from '@/hooks/usePaymentsBreakdown';
import { useRealized } from '@/hooks/useRealized';
import { usePositionsProfit } from '@/hooks/usePositionsProfit';
import { useCryptoPositions } from '@/hooks/useCryptoPositions';
import AllocationDonut from './AllocationDonut';
import AccountSwitcher from './AccountSwitcher';
import AnalyticsMetrics from './AnalyticsMetrics';
import StatCard from './StatCard';
import PositionsTable from './PositionsTable';
import PortfolioMovers from './PortfolioMovers';
import PaymentsView from './PaymentsView';
import YieldBreakdownCard from './YieldBreakdownCard';
import style from './style.module.scss';

const ALL = 'all';
type View = 'overview' | 'analytics' | 'payments';

const ALLOCATION_OPTIONS: { label: string; value: AllocationMode }[] = [
    { label: 'Классы', value: 'type' },
    { label: 'Сектора', value: 'sector' },
    { label: 'Валюта', value: 'currency' },
    { label: 'Рейтинг', value: 'rating' },
    { label: 'Бумаги', value: 'asset' }
];

const tone = (n: number): 'up' | 'down' | 'neutral' => (n > 0 ? 'up' : n < 0 ? 'down' : 'neutral');
const signed = (n: number) => (n > 0 ? '+' : '') + intToRub(n);

interface PortfolioDashboardProps {}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({}) => {
    const { accounts, aggregate, status, isFetching, refetchAll } = usePortfolio();
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const { scope, setScope, view, setView, allocMode, setAllocMode } = usePortfolioPrefs();
    const { data: sectorMap = {} } = useSectors();
    const { data: bondSectorMap = {} } = useBondSectorMap();
    const { data: bondRatings } = useBondRatings();
    const {
        byAccount: breakdownByAccount,
        all: breakdownAll,
        status: breakdownStatus
    } = usePaymentsBreakdown();
    const {
        byAccount: realizedByAccount,
        all: realizedAll,
        status: realizedStatus
    } = useRealized();
    const { extraByUid: profitExtraByUid } = usePositionsProfit();
    // Диагностика крипты (Trezor): показать, почему баланс не виден, если подключён.
    const cryptoDiag = useCryptoPositions();

    if (status === 'loading') {
        return (
            <div>
                <Skeleton.Input active block style={{ height: 40, marginBottom: 20 }} />
                <div className='grid gap-3 mb-5' style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                    {[0, 1, 2, 3].map((i) => (
                        <Skeleton.Node key={i} active style={{ width: '100%', height: 84 }}>
                            <span />
                        </Skeleton.Node>
                    ))}
                </div>
                <Skeleton active paragraph={{ rows: 6 }} />
            </div>
        );
    }

    if (status === 'error') {
        return (
            <Alert
                type='error'
                showIcon
                message='Не удалось загрузить портфель'
                description='Проверьте подключение к сети или переподключите Т-Банк.'
                action={
                    <Button size='small' onClick={refetchAll}>
                        Повторить
                    </Button>
                }
            />
        );
    }

    // Активный счёт мог быть отключён в настройках — откатываемся на «Все счета».
    const selectedAccount = scope === ALL ? null : accounts.find((item) => item.account.id === scope);
    const effectiveScope = scope !== ALL && !selectedAccount ? ALL : scope;

    let scopeData: PortfolioScope | null = null;
    let tableLoading = false;
    let accountError = false;
    if (effectiveScope === ALL) {
        scopeData = aggregate ? scopeFromAggregate(aggregate) : null;
    } else if (selectedAccount) {
        tableLoading = selectedAccount.isLoading;
        accountError = selectedAccount.isError;
        scopeData = selectedAccount.portfolio
            ? scopeFromPortfolio(selectedAccount.portfolio)
            : null;
    }

    // Срезы пончика для выбранного режима (классы/сектора/бумаги).
    const allocationSlices = scopeData
        ? buildAllocation(allocMode, scopeData, sectorMap, bondSectorMap, bondRatings)
        : [];

    // Диагностика крипты: если Trezor подключён, но позиций нет — объясняем почему
    // (ошибка получения баланса/цены или реально нулевые балансы), иначе «пусто»
    // выглядит как баг.
    const cryptoNotice =
        cryptoDiag.hasAccounts && !cryptoDiag.isLoading && cryptoDiag.positions.length === 0 ? (
            <Alert
                className='mb-4'
                type={cryptoDiag.errors.length ? 'warning' : 'info'}
                showIcon
                message='Крипта Trezor не отображается'
                description={
                    cryptoDiag.errors.length ? (
                        <div>
                            <div>Не удалось получить данные:</div>
                            {cryptoDiag.errors.map((e) => (
                                <div key={e.coin}>
                                    <b>{e.coin}</b>: {e.error}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div>
                            Балансы нулевые
                            {cryptoDiag.raw.length
                                ? `: ${cryptoDiag.raw.map((b) => `${b.coin} ${b.amount}`).join(', ')}`
                                : ''}
                            . Проверьте, что монеты лежат на первом счёте кошелька.
                        </div>
                    )
                }
            />
        ) : null;

    // Разбивка выплат для KPI «Доходность» уважает выбранный счёт: «Все счета» →
    // сводный агрегат, иначе — конкретный счёт. Готова только в статусе ready.
    const breakdown = breakdownStatus === 'ready'
        ? (effectiveScope === ALL ? breakdownAll : breakdownByAccount[effectiveScope] ?? null)
        : null;
    const realizedScope = realizedStatus === 'ready'
        ? (effectiveScope === ALL ? realizedAll.realized : realizedByAccount[effectiveScope]?.realized ?? 0)
        : null;
    const breakdownLoading = breakdownStatus === 'loading' || realizedStatus === 'loading';

    return (
        <div>
            {/* L1 — навигация по разделам: вкладки (подчёркивание) читаются как
                верхний уровень, в отличие от фильтра-Select (счёт) и мелкого
                тумблера разбивки ниже. */}
            <Tabs
                activeKey={view}
                onChange={(key) => setView(key as View)}
                items={[
                    { key: 'overview', label: 'Обзор', icon: <DashboardOutlined /> },
                    { key: 'analytics', label: 'Аналитика', icon: <PieChartOutlined /> },
                    { key: 'payments', label: 'Выплаты', icon: <DollarOutlined /> }
                ]}
            />

            {view === 'payments' ? (
                <PaymentsView accounts={accounts} />
            ) : (
                <>
            <div className='flex items-center justify-between gap-3 mb-4'>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <AccountSwitcher
                        accounts={accounts}
                        value={effectiveScope}
                        onChange={(v) => setScope(v)}
                        aggregateTotal={aggregate?.totalAmountPortfolio ?? 0}
                    />
                </div>
                <Button icon={<ReloadOutlined spin={isFetching} />} onClick={refetchAll}>
                    Обновить
                </Button>
            </div>

            {accountError ? (
                <Alert
                    type='error'
                    showIcon
                    className='mb-4'
                    message='Не удалось загрузить счёт'
                    action={
                        <Button size='small' onClick={() => selectedAccount?.refetch()}>
                            Повторить
                        </Button>
                    }
                />
            ) : null}

            {cryptoNotice}

            {view === 'analytics' ? (
                <>
                    {scopeData ? (
                        <AnalyticsMetrics scope={scopeData} effectiveScope={effectiveScope} />
                    ) : null}

                    {scopeData && allocationSlices.length ? (
                    <div className='mb-6'>
                        <div className='mb-3 flex items-center gap-2'>
                            <span style={{ fontSize: 13, color: palette.textMuted }}>Разбивка</span>
                            <Segmented<AllocationMode>
                                size='small'
                                options={ALLOCATION_OPTIONS}
                                value={allocMode}
                                onChange={setAllocMode}
                            />
                        </div>
                        <div
                            className='grid gap-5 items-center'
                            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
                        >
                            <AllocationDonut slices={allocationSlices} total={scopeData.total} />
                            <div className='flex flex-col gap-2'>
                                {allocationSlices.map((slice) => {
                                    const share = scopeData!.total > 0 ? (slice.value / scopeData!.total) * 100 : 0;
                                    return (
                                        <div key={slice.key} className='flex items-center gap-2' style={{ fontSize: 13 }}>
                                            <span
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 2,
                                                    background: slice.color
                                                }}
                                            />
                                            <span className='flex-1'>{slice.label}</span>
                                            <span style={{ color: palette.textMuted }}>{share.toFixed(0)}%</span>
                                            <span style={{ minWidth: 96, textAlign: 'right' }}>
                                                {intToRub(slice.value)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    ) : null}
                </>
            ) : (
                <>
                    <div
                        className='grid gap-3 mb-5'
                        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', alignItems: 'start' }}
                    >
                        <StatCard
                            label='Стоимость'
                            value={intToRub(scopeData?.total ?? 0)}
                            sub={scopeData?.cash ? `в т.ч. кэш ${intToRub(scopeData.cash)}` : undefined}
                            bg={palette.containerBg}
                            border={palette.border}
                            muted={palette.textMuted}
                        />
                        <YieldBreakdownCard
                            unrealized={scopeData?.plAbs ?? 0}
                            breakdown={breakdown}
                            realized={realizedScope}
                            loading={breakdownLoading}
                            bg={palette.containerBg}
                            border={palette.border}
                            muted={palette.textMuted}
                        />
                        <StatCard
                            label='За день'
                            value={signed(scopeData?.dayAbs ?? 0)}
                            sub={formatPercent(scopeData?.dayPct ?? 0)}
                            tone={tone(scopeData?.dayAbs ?? 0)}
                            bg={palette.containerBg}
                            border={palette.border}
                            muted={palette.textMuted}
                        />
                    </div>

                    <div
                        className='grid gap-4 mb-6'
                        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
                    >
                        <PortfolioMovers
                            positions={scopeData?.positions ?? []}
                            loading={tableLoading}
                            direction='up'
                            borderless
                            index={0}
                        />
                        <PortfolioMovers
                            positions={scopeData?.positions ?? []}
                            loading={tableLoading}
                            direction='down'
                            borderless
                            index={1}
                        />
                    </div>

                    <PositionsTable
                        positions={scopeData?.positions ?? []}
                        total={scopeData?.total ?? 0}
                        loading={tableLoading}
                        profitExtraByUid={profitExtraByUid}
                    />
                </>
            )}
                </>
            )}
        </div>
    );
};
export default PortfolioDashboard;
