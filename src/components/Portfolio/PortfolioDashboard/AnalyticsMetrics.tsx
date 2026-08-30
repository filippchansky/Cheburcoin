'use client';
import React from 'react';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { formatPercent } from '@/utils/formatCurrency';
import { PortfolioScope } from '@/utils/portfolioScope';
import { concentration } from '@/utils/portfolioMetrics';
import { useCashflows } from '@/hooks/useCashflows';
import { usePaymentsCalendar } from '@/hooks/usePaymentsCalendar';
import { xirr } from '@/utils/xirr';
import StatCard, { StatTone } from './StatCard';

const ALL = 'all';
const tone = (n: number): StatTone => (n > 0 ? 'up' : n < 0 ? 'down' : 'neutral');
/** Процент в ru-формате без знака (доходности натурально положительны). */
const pct = (n: number) =>
    `${n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

interface AnalyticsMetricsProps {
    /** Срез портфеля (выбранный счёт или все) — источник позиций и стоимости. */
    scope: PortfolioScope;
    /** Активный счёт: 'all' или его id — для выбора потоков XIRR. */
    effectiveScope: string;
}

/**
 * KPI-ряд вкладки «Аналитика»: XIRR, концентрация, дивдоходность. Вынесен в
 * отдельный компонент, чтобы запросы cashflows/coupons/dividends летели только при
 * открытии аналитики, а не на «Обзоре». Каждая плитка деградирует независимо
 * («…»/«—»), если её данные ещё не готовы или их недостаточно.
 */
const AnalyticsMetrics: React.FC<AnalyticsMetricsProps> = ({ scope, effectiveScope }) => {
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);

    // XIRR — годовая доходность с учётом дат/величины пополнений. К внешним потокам
    // добавляем терминальную стоимость сегодня («как будто продали всё»).
    const { byAccount: cfByAccount, all: cfAll, status: cfStatus } = useCashflows();
    const xirrValue = (() => {
        if (cfStatus !== 'ready' || scope.total <= 0) return null;
        const flows = effectiveScope === ALL ? cfAll.items : cfByAccount[effectiveScope]?.items ?? [];
        if (!flows.length) return null;
        const today = new Date().toISOString().slice(0, 10);
        return xirr([...flows, { date: today, amount: scope.total }]);
    })();
    const xirrLoading = cfStatus === 'loading';
    const xirrHasNonRub = cfStatus === 'ready'
        ? (effectiveScope === ALL ? cfAll.hasNonRub : cfByAccount[effectiveScope]?.hasNonRub ?? false)
        : false;

    // Концентрация (топ-5 / эффективное число бумаг) — по текущим позициям среза.
    const conc = concentration(scope.positions);

    // Дивдоходность — прогноз выплат за 12 мес (купоны + дивиденды, вкл. прогноз) к
    // текущей стоимости платящих бумаг и к их себестоимости (yield on cost).
    const bondPositions = scope.positions.filter((p) => p.instrumentType === 'bond');
    const sharePositions = scope.positions.filter(
        (p) => p.instrumentType === 'share' || p.instrumentType === 'etf'
    );
    const cal = usePaymentsCalendar(bondPositions, sharePositions);
    const yearly = cal.couponTotal + cal.dividendTotal + cal.dividendProjectedTotal;
    const payoutYield = cal.status === 'ready' && cal.payingValue > 0 ? (yearly / cal.payingValue) * 100 : null;
    const yieldOnCost = cal.status === 'ready' && cal.costValue > 0 ? (yearly / cal.costValue) * 100 : null;
    const calLoading = cal.status === 'loading';

    const cardProps = { bg: palette.containerBg, border: palette.border, muted: palette.textMuted };

    return (
        <div
            className='grid gap-3 mb-5'
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', alignItems: 'start' }}
        >
            <StatCard
                label='Доходность годовых'
                value={xirrLoading ? '…' : xirrValue !== null ? formatPercent(xirrValue * 100) : '—'}
                sub={
                    xirrValue !== null
                        ? xirrHasNonRub
                            ? 'XIRR, без валютных потоков'
                            : 'XIRR, с учётом пополнений'
                        : xirrLoading
                          ? 'считаем по истории…'
                          : 'недостаточно истории'
                }
                tone={xirrValue !== null ? tone(xirrValue) : 'neutral'}
                {...cardProps}
            />
            {conc ? (
                <StatCard
                    label='Концентрация'
                    value={`${Math.round(conc.top5 * 100)}%`}
                    sub={`топ-5 бумаг · как ${Math.round(conc.effectiveN)} равных из ${conc.count}`}
                    {...cardProps}
                />
            ) : null}
            {cal.status !== 'empty' ? (
                <StatCard
                    label='Дивдоходность · % годовых'
                    value={calLoading ? '…' : payoutYield !== null ? pct(payoutYield) : '—'}
                    sub={
                        calLoading
                            ? 'считаем прогноз выплат…'
                            : yieldOnCost !== null
                              ? `${pct(yieldOnCost)} на вложенное`
                              : 'выплаты за 12 мес к цене'
                    }
                    {...cardProps}
                />
            ) : null}
        </div>
    );
};

export default AnalyticsMetrics;
