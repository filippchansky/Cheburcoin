'use client';
import React from 'react';
import { Alert, Button, Segmented, Skeleton } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { intToRub, formatPercent } from '@/utils/formatCurrency';
import { instrumentTypeLabel } from '@/utils/instrumentType';
import {
    PortfolioScope,
    scopeFromAggregate,
    scopeFromPortfolio
} from '@/utils/portfolioScope';
import AllocationDonut from './AllocationDonut';
import PositionsTable from './PositionsTable';
import style from './style.module.scss';

const ALL = 'all';

const SLICE_COLOR: Record<string, string> = {
    share: '#2a78d6',
    bond: '#1baf7a',
    etf: '#7f77dd',
    currency: '#eda100',
    futures: '#eb6834'
};

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

    return (
        <div>
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

            <div
                className='grid gap-3 mb-5'
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}
            >
                <StatCard
                    label='Стоимость'
                    value={intToRub(scopeData?.total ?? 0)}
                    sub={scopeData?.cash ? `в т.ч. кэш ${intToRub(scopeData.cash)}` : undefined}
                    bg={palette.containerBg}
                    border={palette.border}
                    muted={palette.textMuted}
                />
                <StatCard
                    label='Доходность'
                    value={signed(scopeData?.plAbs ?? 0)}
                    sub={formatPercent(scopeData?.plPct ?? 0)}
                    tone={tone(scopeData?.plAbs ?? 0)}
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
                <StatCard
                    label='Позиций'
                    value={String(scopeData?.positions.length ?? 0)}
                    bg={palette.containerBg}
                    border={palette.border}
                    muted={palette.textMuted}
                />
            </div>

            {scopeData && scopeData.allocation.length ? (
                <div
                    className='grid gap-5 mb-6 items-center'
                    style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
                >
                    <AllocationDonut allocation={scopeData.allocation} total={scopeData.total} />
                    <div className='flex flex-col gap-2'>
                        {scopeData.allocation.map((slice) => {
                            const share = scopeData!.total > 0 ? (slice.value / scopeData!.total) * 100 : 0;
                            return (
                                <div key={slice.type} className='flex items-center gap-2' style={{ fontSize: 13 }}>
                                    <span
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: 2,
                                            background: SLICE_COLOR[slice.type] ?? palette.textMuted
                                        }}
                                    />
                                    <span className='flex-1'>{instrumentTypeLabel(slice.type)}</span>
                                    <span style={{ color: palette.textMuted }}>{share.toFixed(0)}%</span>
                                    <span style={{ minWidth: 96, textAlign: 'right' }}>
                                        {intToRub(slice.value)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : null}

            <PositionsTable
                positions={scopeData?.positions ?? []}
                total={scopeData?.total ?? 0}
                loading={tableLoading}
            />
        </div>
    );
};
export default PortfolioDashboard;
