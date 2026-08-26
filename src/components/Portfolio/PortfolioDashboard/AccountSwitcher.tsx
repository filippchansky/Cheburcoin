'use client';
import React from 'react';
import { Segmented, Drawer, Grid } from 'antd';
import { DownOutlined, CheckOutlined } from '@ant-design/icons';
import { AccountPortfolio } from '@/hooks/usePortfolio';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { intToRub } from '@/utils/formatCurrency';

const ALL = 'all';

interface AccountSwitcherProps {
    /** Счета портфеля (для имён и балансов в шторке). */
    accounts: AccountPortfolio[];
    /** Текущий выбор: 'all' или id счёта. */
    value: string;
    onChange: (value: string) => void;
    /** Стоимость свода (для строки «Все счета»). */
    aggregateTotal: number;
}

interface Row {
    id: string;
    name: string;
    total: number;
    /** Дневная доходность счёта в ₽; null у «Все счета». */
    day: number | null;
}

/** Подписанный рубль дневной доходности (как `signed` в дашборде). */
const signed = (n: number) => (n > 0 ? '+' : '') + intToRub(n);

/**
 * Переключатель счёта портфеля. На десктопе — привычный `Segmented`, на мобилке
 * (screens.md === false) горизонтальный скролл заменён нижней шторкой (`Drawer`)
 * со списком счетов и их балансами: крупные тап-цели, масштабируется на любое
 * число счетов и заодно показывает стоимость каждого.
 */
const AccountSwitcher: React.FC<AccountSwitcherProps> = ({
    accounts,
    value,
    onChange,
    aggregateTotal
}) => {
    const screens = Grid.useBreakpoint();
    const isMobile = screens.md === false;
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const [open, setOpen] = React.useState(false);

    const options = [
        { label: 'Все счета', value: ALL },
        ...accounts.map((item) => ({ label: item.account.name, value: item.account.id }))
    ];

    if (!isMobile) {
        return (
            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                <Segmented options={options} value={value} onChange={(v) => onChange(v as string)} />
            </div>
        );
    }

    const rows: Row[] = [
        { id: ALL, name: 'Все счета', total: aggregateTotal, day: null },
        ...accounts.map((item) => ({
            id: item.account.id,
            name: item.account.name,
            total: item.portfolio?.totalAmountPortfolio ?? 0,
            day: item.portfolio?.dailyYield ?? null
        }))
    ];
    const current = rows.find((r) => r.id === value) ?? rows[0];
    const selectedTint = darkTheme ? 'rgba(124,116,255,0.16)' : 'rgba(99,91,255,0.10)';

    const select = (id: string) => {
        onChange(id);
        setOpen(false);
    };

    return (
        <>
            <button
                type='button'
                onClick={() => setOpen(true)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: palette.containerBg,
                    border: `1px solid ${palette.border}`,
                    borderRadius: 10,
                    padding: '10px 14px',
                    color: 'inherit'
                }}
            >
                <span style={{ minWidth: 0 }}>
                    <span
                        style={{
                            display: 'block',
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {current.name}
                    </span>
                    <span style={{ display: 'block', fontSize: 12, color: palette.textMuted }}>
                        {intToRub(current.total)}
                    </span>
                </span>
                <DownOutlined style={{ color: palette.textMuted, flexShrink: 0 }} />
            </button>

            <Drawer
                open={open}
                onClose={() => setOpen(false)}
                placement='bottom'
                height='auto'
                title='Счёт'
                styles={{ body: { padding: 8 } }}
            >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {rows.map((r) => {
                        const selected = r.id === value;
                        const dayTone =
                            (r.day ?? 0) > 0 ? '#1baf7a' : (r.day ?? 0) < 0 ? '#e24b4a' : palette.textMuted;
                        return (
                            <button
                                key={r.id}
                                type='button'
                                onClick={() => select(r.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 12,
                                    width: '100%',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    background: selected ? selectedTint : 'transparent',
                                    border: 'none',
                                    borderRadius: 10,
                                    padding: '12px',
                                    color: 'inherit'
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                    <CheckOutlined
                                        style={{
                                            color: palette.primary,
                                            visibility: selected ? 'visible' : 'hidden',
                                            flexShrink: 0
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontWeight: 500,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {r.name}
                                    </span>
                                </span>
                                <span style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <span style={{ display: 'block' }}>{intToRub(r.total)}</span>
                                    {r.day !== null && r.day !== 0 ? (
                                        <span style={{ display: 'block', fontSize: 12, color: dayTone }}>
                                            {signed(r.day)}
                                        </span>
                                    ) : null}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </Drawer>
        </>
    );
};
export default AccountSwitcher;
