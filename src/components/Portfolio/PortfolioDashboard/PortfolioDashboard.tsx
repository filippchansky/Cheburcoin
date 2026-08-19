'use client';
import React from 'react';
import { Alert, Button, Segmented, Skeleton } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useSectors } from '@/hooks/useShares';
import { useBondSectorMap } from '@/hooks/useBonds';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { intToRub, formatPercent } from '@/utils/formatCurrency';
import {
    PortfolioScope,
    scopeFromAggregate,
    scopeFromPortfolio
} from '@/utils/portfolioScope';
import { AllocationMode, buildAllocation } from '@/utils/portfolioAllocation';
import { usePaymentsBreakdown } from '@/hooks/usePaymentsBreakdown';
import { useRealized } from '@/hooks/useRealized';
import { usePositionsProfit } from '@/hooks/usePositionsProfit';
import { useCryptoPositions } from '@/hooks/useCryptoPositions';
import { useCashflows } from '@/hooks/useCashflows';
import { xirr } from '@/utils/xirr';
import AllocationDonut from './AllocationDonut';
import PositionsTable from './PositionsTable';
import PaymentsView from './PaymentsView';
import YieldBreakdownCard from './YieldBreakdownCard';
import style from './style.module.scss';

const ALL = 'all';
type View = 'overview' | 'payments';

const ALLOCATION_OPTIONS: { label: string; value: AllocationMode }[] = [
    { label: 'Классы', value: 'type' },
    { label: 'Сектора', value: 'sector' },
    { label: 'Бумаги', value: 'asset' }
];

interface StatCardProps {
    label: string;
    value: string;
    sub?: string;
    tone?: 'up' | 'down' | 'neutral';
    bg: string;
    border: string;
    muted: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, tone = 'neutral', bg, border, muted }) => {
    const color =
        tone === 'up' ? '#1baf7a' : tone === 'down' ? '#e24b4a' : 'inherit';
    return (
        <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, color: muted, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color }}>{value}</div>
            {sub ? <div style={{ fontSize: 13, color, marginTop: 2 }}>{sub}</div> : null}
        </div>
    );
};

const tone = (n: number): 'up' | 'down' | 'neutral' => (n > 0 ? 'up' : n < 0 ? 'down' : 'neutral');
const signed = (n: number) => (n > 0 ? '+' : '') + intToRub(n);

interface PortfolioDashboardProps {}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({}) => {
    const { accounts, aggregate, status, isFetching, refetchAll } = usePortfolio();
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const [scope, setScope] = React.useState<string>(ALL);
    const [view, setView] = React.useState<View>('overview');
    const [allocMode, setAllocMode] = React.useState<AllocationMode>('type');
    const { data: sectorMap = {} } = useSectors();
    const { data: bondSectorMap = {} } = useBondSectorMap();
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
    // const {
    //     byAccount: cashflowsByAccount,
    //     all: cashflowsAll,
    //     status: cashflowsStatus
    // } = useCashflows();

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

    const options = [
        { label: 'Все счета', value: ALL },
        ...accounts.map((item) => ({ label: item.account.name, value: item.account.id }))
    ];

    // Календарь выплат считаем по всем счетам (агрегат), вне переключателя счёта.
    const allPositions = aggregate?.positions ?? [];
    const bondPositions = allPositions.filter((item) => item.instrumentType === 'bond');
    // Дивиденды платят и акции, и фонды (etf) — берём оба типа.
    const sharePositions = allPositions.filter(
        (item) => item.instrumentType === 'share' || item.instrumentType === 'etf'
    );

    // Срезы пончика для выбранного режима (классы/сектора/бумаги).
    const allocationSlices = scopeData
        ? buildAllocation(allocMode, scopeData, sectorMap, bondSectorMap)
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

    // XIRR (годовая доходность с учётом дат/величины пополнений и выводов). К
    // внешним потокам добавляем терминальную стоимость портфеля сегодня — как
    // будто «продали всё». Считаем инлайн: hooks выше early-return нельзя.
    // const xirrValue = (() => {
    //     if (cashflowsStatus !== 'ready' || !scopeData || scopeData.total <= 0) return null;
    //     const flows = effectiveScope === ALL
    //         ? cashflowsAll.items
    //         : cashflowsByAccount[effectiveScope]?.items ?? [];
    //     if (!flows.length) return null;
    //     const today = new Date().toISOString().slice(0, 10);
    //     return xirr([...flows, { date: today, amount: scopeData.total }]);
    // })();

    return (
        <div>
            <div className='mb-4'>
                <Segmented<View>
                    options={[
                        { label: 'Обзор', value: 'overview' },
                        { label: 'Выплаты', value: 'payments' }
                    ]}
                    value={view}
                    onChange={setView}
                />
            </div>

            {view === 'payments' ? (
                <PaymentsView bondPositions={bondPositions} sharePositions={sharePositions} />
            ) : (
                <>
            <div className='flex items-center justify-between gap-3 mb-4 flex-wrap'>
                <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                    <Segmented options={options} value={effectiveScope} onChange={(v) => setScope(v as string)} />
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
                {/* <StatCard
                    label='Годовых (XIRR)'
                    value={xirrValue !== null ? formatPercent(xirrValue * 100) : '—'}
                    sub={xirrValue !== null ? 'с учётом дат пополнений' : cashflowsStatus === 'loading' ? 'считаем…' : undefined}
                    tone={xirrValue !== null ? tone(xirrValue) : 'neutral'}
                    bg={palette.containerBg}
                    border={palette.border}
                    muted={palette.textMuted}
                /> */}
                {/* <StatCard
                    label='Позиций'
                    value={String(scopeData?.positions.length ?? 0)}
                    bg={palette.containerBg}
                    border={palette.border}
                    muted={palette.textMuted}
                /> */}
            </div>

            {scopeData && allocationSlices.length ? (
                <div className='mb-6'>
                    <div className='mb-3'>
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

            <PositionsTable
                positions={scopeData?.positions ?? []}
                total={scopeData?.total ?? 0}
                loading={tableLoading}
                profitExtraByUid={profitExtraByUid}
            />
                </>
            )}
        </div>
    );
};
export default PortfolioDashboard;
