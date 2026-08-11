'use client';
import React from 'react';
import { DownOutlined } from '@ant-design/icons';
import { PaymentsBreakdown } from '@/hooks/usePaymentsBreakdown';
import { intToRub } from '@/utils/formatCurrency';

const UP = '#1baf7a';
const DOWN = '#e24b4a';
const toneColor = (n: number) => (n > 0 ? UP : n < 0 ? DOWN : 'inherit');
const signed = (n: number) => (n > 0 ? '+' : '') + intToRub(n);

interface Row {
    label: string;
    value: number;
    /** Всегда показывать строку, даже если 0 (для «Переоценки»). */
    always?: boolean;
}

interface YieldBreakdownCardProps {
    /** Нереализованная переоценка открытых позиций (expectedYieldInt), ₽. */
    unrealized: number;
    /** Разбивка полученных выплат за всё время; null, пока грузится. */
    breakdown: PaymentsBreakdown | null;
    /** Реализованный P/L по проданным бумагам, ₽; null, пока грузится. */
    realized: number | null;
    /** Данные (выплаты/реализованное) ещё грузятся — показываем только переоценку. */
    loading: boolean;
    bg: string;
    border: string;
    muted: string;
}

/**
 * KPI «Доходность» с раскрывающейся разбивкой: переоценка открытых позиций +
 * полученные купоны/дивиденды − налоги. Пока выплаты грузятся — показываем одну
 * переоценку (как было), затем итог дополняется выплатами. Строка «Реализовано»
 * (Этап 2) впишется сюда же следующей.
 */
const YieldBreakdownCard: React.FC<YieldBreakdownCardProps> = ({
    unrealized,
    breakdown,
    realized,
    loading,
    bg,
    border,
    muted
}) => {
    const [open, setOpen] = React.useState(false);

    const total = unrealized + (realized ?? 0) + (breakdown?.net ?? 0);
    const canExpand = !loading && !!breakdown;

    const rows: Row[] = [
        { label: 'Переоценка', value: unrealized, always: true },
        // Реализованное — только когда данные готовы (realized !== null).
        ...(realized !== null ? [{ label: 'Реализовано', value: realized }] : []),
        { label: 'Купоны', value: breakdown?.coupons ?? 0 },
        { label: 'Дивиденды', value: breakdown?.dividends ?? 0 },
        { label: 'Налоги', value: -(breakdown?.taxes ?? 0) },
        { label: 'Комиссии', value: -(breakdown?.fees ?? 0) }
    ].filter((row) => row.always || row.value !== 0);

    return (
        <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 16px' }}>
            <button
                type='button'
                onClick={() => canExpand && setOpen((v) => !v)}
                disabled={!canExpand}
                style={{
                    all: 'unset',
                    display: 'block',
                    width: '100%',
                    cursor: canExpand ? 'pointer' : 'default'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: muted }}>Доходность</span>
                    {canExpand ? (
                        <span
                            style={{
                                fontSize: 10,
                                color: muted,
                                lineHeight: 1,
                                display: 'inline-flex',
                                transition: 'transform 0.25s ease',
                                transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
                        >
                            <DownOutlined />
                        </span>
                    ) : null}
                </div>
                <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color: toneColor(total) }}>
                    {signed(total)}
                </div>
                <div style={{ fontSize: 13, color: muted, marginTop: 2 }}>
                    {loading
                        ? 'учитываем выплаты и продажи…'
                        : breakdown
                          ? 'с выплатами и реализованным'
                          : 'переоценка позиций'}
                </div>
            </button>

            {breakdown ? (
                // Плавное раскрытие: grid-template-rows 0fr→1fr тянет высоту без
                // фиксированного max-height, поэтому работает при любом числе строк.
                <div
                    style={{
                        display: 'grid',
                        gridTemplateRows: open ? '1fr' : '0fr',
                        transition: 'grid-template-rows 0.25s ease'
                    }}
                >
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${border}` }}>
                            {rows.map((row) => (
                                <div
                                    key={row.label}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: 13,
                                        marginBottom: 6
                                    }}
                                >
                                    <span style={{ color: muted }}>{row.label}</span>
                                    <span style={{ color: toneColor(row.value) }}>{signed(row.value)}</span>
                                </div>
                            ))}
                            {breakdown.hasNonRub ? (
                                <div style={{ fontSize: 12, color: muted, marginTop: 8 }}>
                                    Валютные выплаты не учтены в рублёвом итоге.
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
export default YieldBreakdownCard;
