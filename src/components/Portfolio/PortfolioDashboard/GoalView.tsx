'use client';
import React from 'react';
import { Alert, Button, Card, InputNumber, Popover, Segmented, Slider, Switch } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { intToRub } from '@/utils/formatCurrency';
import { PortfolioScope } from '@/utils/portfolioScope';
import { usePortfolioPrefs } from '@/store/portfolioPrefs';
import { usePaymentsCalendar } from '@/hooks/usePaymentsCalendar';
import { humanizeMonths, projectGoal, reachedDate } from '@/utils/goalProjection';
import StatCard from './StatCard';

interface GoalViewProps {
    /** Срез портфеля (выбранный счёт или все) — источник стоимости и позиций. */
    scope: PortfolioScope;
}

/** Пресеты допущений (рост цены / рост выплат / инфляция), %/год. */
type ScenarioKey = 'conservative' | 'base' | 'optimistic';
const SCENARIOS: {
    key: ScenarioKey;
    label: string;
    priceGrowthPct: number;
    incomeGrowthPct: number;
    inflationPct: number;
    hint: string;
}[] = [
    {
        key: 'conservative',
        label: 'Консервативный',
        priceGrowthPct: 0,
        incomeGrowthPct: 0,
        inflationPct: 8,
        hint: 'Рост не закладываем, инфляцию берём высокой.'
    },
    {
        key: 'base',
        label: 'Базовый',
        priceGrowthPct: 4,
        incomeGrowthPct: 5,
        inflationPct: 7,
        hint: 'Умеренные допущения на уровне долгих средних по рынку РФ.'
    },
    {
        key: 'optimistic',
        label: 'Оптимистичный',
        priceGrowthPct: 8,
        incomeGrowthPct: 8,
        inflationPct: 5,
        hint: 'Оптимизм: рост выше среднего, инфляция у таргета ЦБ.'
    }
];

const rub = (n: number) => intToRub(Math.round(n));
const pct1 = (n: number) => `${n.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`;
const dateFmt = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });
/** Форматтер тысяч для InputNumber (пробел-разделитель, как в ₽). */
const groupFmt = (v: number | string | undefined) =>
    `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const groupParse = (v: string | undefined) => (v ? Number(v.replace(/\s/g, '')) : 0) as number;

/**
 * Вкладка «Цель»: сколько времени до целевого пассивного дохода (₽/мес) при
 * заданных пополнениях, доходности и росте. Модель — в `projectGoal`. Стартовая
 * доходность по умолчанию берётся из прогноза выплат на 12 мес (usePaymentsCalendar),
 * пользователь может переопределить её и остальные допущения (сохраняются в prefs).
 */
const GoalView: React.FC<GoalViewProps> = ({ scope }) => {
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const goal = usePortfolioPrefs((s) => s.goal);
    const setGoal = usePortfolioPrefs((s) => s.setGoal);

    // Прогноз выплат за 12 мес → текущая доходность портфеля (для дефолта и подсказки).
    const bondPositions = scope.positions.filter((p) => p.instrumentType === 'bond');
    const sharePositions = scope.positions.filter(
        (p) => p.instrumentType === 'share' || p.instrumentType === 'etf'
    );
    const cal = usePaymentsCalendar(bondPositions, sharePositions);
    const yearly = cal.couponTotal + cal.dividendTotal + cal.dividendProjectedTotal;

    // База прогноза — только бумаги, РЕАЛЬНО дающие выплаты в ближайшие 12 мес: сужаем
    // до инструментов, у которых есть события в календаре (тот же набор, что кормит
    // числитель `yearly`). «Молчащие» акции/фонды и, тем более, крипта/валюта/кэш в
    // базу не входят — иначе доходность размывается и цель кажется ближе. Это совпадает
    // с галочкой «только по платящим» на вкладке «Выплаты». Суммы в ₽ по курсу ЦБ.
    const payingIds = new Set(cal.events.map((e) => e.instrumentId));
    const payingValue =
        cal.status === 'ready'
            ? Array.from(payingIds).reduce((sum, id) => sum + (cal.payingValueByUid.get(id) ?? 0), 0)
            : 0;
    const payoutYield = payingValue > 0 ? (yearly / payingValue) * 100 : 0;

    // Доходность: явная из prefs либо текущая по платящим бумагам (режим «Авто»).
    const yieldPct = goal.dividendYieldPct ?? (cal.status === 'ready' ? Number(payoutYield.toFixed(2)) : 0);
    const usingAutoYield = goal.dividendYieldPct === null;

    const result = projectGoal({
        currentValue: payingValue,
        targetMonthly: goal.targetMonthly,
        monthlyContribution: goal.monthlyContribution,
        dividendYieldPct: yieldPct,
        priceGrowthPct: goal.priceGrowthPct,
        incomeGrowthPct: goal.incomeGrowthPct,
        inflationPct: goal.inflationPct,
        reinvest: goal.reinvest
    });

    const progress =
        goal.targetMonthly > 0 ? Math.min(100, (result.startMonthlyIncome / goal.targetMonthly) * 100) : 0;
    const gap = Math.max(0, (result.requiredCapital ?? 0) - payingValue);
    const finish = reachedDate(result.reachedMonth);
    const cardProps = { bg: palette.containerBg, border: palette.border, muted: palette.textMuted };

    // Активный пресет: подсвечиваем чип, только если все три допущения совпали с ним;
    // после ручной правки любого слайдера выбор снимается ('').
    const matched = SCENARIOS.find(
        (s) =>
            s.priceGrowthPct === goal.priceGrowthPct &&
            s.incomeGrowthPct === goal.incomeGrowthPct &&
            s.inflationPct === goal.inflationPct
    );
    const activeScenario: ScenarioKey | '' = matched?.key ?? '';
    const scenarioHint = matched?.hint ?? 'Свои значения — крутите слайдеры ниже или выберите пресет.';

    // --- График: месячный пассивный доход во времени + линия цели ---
    const line = result.series.map((p) => [Number((p.month / 12).toFixed(3)), Math.round(p.monthlyIncome)]);
    const capitalByMonth = new Map(result.series.map((p) => [p.month, p.capital]));
    const lastYears = result.series.length ? result.series[result.series.length - 1].month / 12 : 1;

    // --- Годовая разбивка: точки на границах лет + финальная точка достижения ---
    const yearRows = (() => {
        const rows = result.series.filter((p) => p.month > 0 && p.month % 12 === 0);
        const last = result.series[result.series.length - 1];
        if (last && last.month > 0 && last.month % 12 !== 0) rows.push(last);
        return rows.map((p) => {
            const d = reachedDate(p.month);
            return {
                month: p.month,
                yearLabel: d ? String(d.getFullYear()) : '',
                agoLabel: `+${(p.month / 12).toFixed(p.month % 12 === 0 ? 0 : 1)} г.`,
                capital: p.capital,
                monthlyIncome: p.monthlyIncome,
                share:
                    goal.targetMonthly > 0
                        ? Math.min(100, (p.monthlyIncome / goal.targetMonthly) * 100)
                        : 0
            };
        });
    })();

    const chartOption = {
        grid: { left: 8, right: 16, top: 24, bottom: 24, containLabel: true },
        tooltip: {
            trigger: 'axis',
            formatter: (params: { data: [number, number]; axisValue: number }[]) => {
                const p = params[0];
                const years = p.data[0];
                const month = Math.round(years * 12);
                const d = reachedDate(month);
                const cap = capitalByMonth.get(month) ?? 0;
                return `${d ? dateFmt.format(d) : ''}<br/>Доход: <b>${rub(p.data[1])}/мес</b><br/>Капитал: ${rub(cap)}`;
            }
        },
        xAxis: {
            type: 'value',
            min: 0,
            max: Number(lastYears.toFixed(2)) || 1,
            name: 'лет',
            nameLocation: 'end',
            axisLabel: { color: palette.textMuted, formatter: (v: number) => `${v}` },
            axisLine: { lineStyle: { color: palette.border } },
            splitLine: { show: false }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: palette.textMuted,
                formatter: (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)
            },
            splitLine: { lineStyle: { color: palette.border } }
        },
        series: [
            {
                type: 'line',
                data: line,
                smooth: true,
                showSymbol: false,
                lineStyle: { color: palette.primary, width: 2 },
                areaStyle: { color: palette.primary, opacity: 0.12 },
                markLine: {
                    silent: true,
                    symbol: 'none',
                    data: [{ yAxis: goal.targetMonthly }],
                    label: {
                        formatter: `Цель ${rub(goal.targetMonthly)}`,
                        color: palette.textMuted,
                        position: 'insideStartTop'
                    },
                    lineStyle: { color: '#e2a04b', type: 'dashed' }
                }
            }
        ]
    };

    const yieldHint =
        cal.status === 'loading'
            ? 'считаем текущую доходность…'
            : cal.status === 'ready'
              ? payoutYield > 0
                  ? `по платящим бумагам сейчас ~${pct1(payoutYield)} (${rub(payingValue)})`
                  : 'в этом счёте нет бумаг с выплатами'
              : 'подключите Т-Банк, чтобы взять текущую';

    return (
        <div>
            <div
                className='grid gap-3 mb-5'
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', alignItems: 'start' }}
            >
                <StatCard
                    label='Текущий доход'
                    value={cal.status === 'loading' ? '…' : `${rub(result.startMonthlyIncome)}/мес`}
                    sub={`${Math.round(progress)}% от цели`}
                    {...cardProps}
                />
                <StatCard
                    label='Требуемый капитал'
                    value={result.requiredCapital !== null ? rub(result.requiredCapital) : '—'}
                    sub={
                        result.requiredCapital !== null
                            ? gap > 0
                                ? `осталось накопить ${rub(gap)}`
                                : 'капитал набран'
                            : 'при доходности 0% недостижимо'
                    }
                    {...cardProps}
                />
                <StatCard
                    label='Достижение цели'
                    value={humanizeMonths(result.reachedMonth)}
                    sub={finish ? dateFmt.format(finish) : 'измените параметры ниже'}
                    tone={result.reachedMonth !== null ? 'up' : 'neutral'}
                    {...cardProps}
                />
            </div>

            {result.reachedMonth === null ? (
                <Alert
                    className='mb-4'
                    type='info'
                    showIcon
                    message='Цель не достигается за 60 лет при текущих параметрах'
                    description='Увеличьте ежемесячное пополнение, доходность или ожидаемый рост — прогноз пересчитается.'
                />
            ) : null}

            <div className='flex flex-wrap gap-4 mb-2' style={{ alignItems: 'flex-start' }}>
                {/* Параметры */}
                <Card
                    size='small'
                    title='Параметры'
                    style={{ flex: '1 1 260px', maxWidth: 400 }}
                    extra={
                        <Popover
                            trigger='click'
                            title='Как считается прогноз'
                            content={
                                <div style={{ maxWidth: 300, fontSize: 13, lineHeight: 1.5 }}>
                                    <p style={{ margin: '0 0 8px' }}>Помесячная симуляция от текущего портфеля:</p>
                                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                                        <li>капитал за месяц растёт на рост цены, пополнение и — если включено — реинвест выплат;</li>
                                        <li>пассивный доход = капитал × доходность ÷ 12;</li>
                                        <li>раз в год доходность повышается на «рост выплат»;</li>
                                        <li>доход и капитал приводятся к сегодняшним рублям по инфляции, цель зафиксирована в деньгах сегодня;</li>
                                        <li>цель достигнута, когда месячный доход ≥ целевого.</li>
                                    </ul>
                                    <p style={{ margin: '8px 0 0' }}>
                                        База — только платящие бумаги (облигации + акции/фонды); крипта,
                                        валюта и кэш не участвуют.
                                    </p>
                                </div>
                            }
                        >
                            <Button type='text' size='small' icon={<QuestionCircleOutlined />}>
                                Как считается
                            </Button>
                        </Popover>
                    }
                    styles={{ body: { display: 'flex', flexDirection: 'column', gap: 16 } }}
                >
                    <div className='flex flex-col gap-1'>
                        <span style={{ fontSize: 13, color: palette.textMuted }}>Сценарий допущений</span>
                        <Segmented<ScenarioKey | ''>
                            block
                            value={activeScenario}
                            onChange={(key) => {
                                const s = SCENARIOS.find((item) => item.key === key);
                                if (s)
                                    setGoal({
                                        priceGrowthPct: s.priceGrowthPct,
                                        incomeGrowthPct: s.incomeGrowthPct,
                                        inflationPct: s.inflationPct
                                    });
                            }}
                            options={SCENARIOS.map((s) => ({ label: s.label, value: s.key }))}
                        />
                        <span style={{ fontSize: 12, color: palette.textMuted }}>{scenarioHint}</span>
                    </div>

                    <label className='flex flex-col gap-1'>
                        <span style={{ fontSize: 13, color: palette.textMuted }}>Цель, ₽/мес</span>
                        <InputNumber
                            value={goal.targetMonthly}
                            onChange={(v) => setGoal({ targetMonthly: Number(v) || 0 })}
                            min={0}
                            step={5000}
                            style={{ width: '100%' }}
                            formatter={groupFmt}
                            parser={groupParse}
                        />
                    </label>

                    <label className='flex flex-col gap-1'>
                        <span style={{ fontSize: 13, color: palette.textMuted }}>Пополнение, ₽/мес</span>
                        <InputNumber
                            value={goal.monthlyContribution}
                            onChange={(v) => setGoal({ monthlyContribution: Number(v) || 0 })}
                            min={0}
                            step={5000}
                            style={{ width: '100%' }}
                            formatter={groupFmt}
                            parser={groupParse}
                        />
                    </label>

                    <div className='flex flex-col gap-1'>
                        <div className='flex items-center justify-between'>
                            <span style={{ fontSize: 13, color: palette.textMuted }}>Доходность, % годовых</span>
                            <Segmented
                                size='small'
                                value={usingAutoYield ? 'auto' : 'manual'}
                                onChange={(v) =>
                                    setGoal({ dividendYieldPct: v === 'auto' ? null : Number(yieldPct.toFixed(2)) })
                                }
                                options={[
                                    { label: 'Авто', value: 'auto' },
                                    { label: 'Вручную', value: 'manual' }
                                ]}
                            />
                        </div>
                        <InputNumber
                            value={Number(yieldPct.toFixed(2))}
                            onChange={(v) => setGoal({ dividendYieldPct: Number(v) || 0 })}
                            disabled={usingAutoYield}
                            min={0}
                            max={100}
                            step={0.5}
                            addonAfter='%'
                            style={{ width: '100%' }}
                        />
                        <span style={{ fontSize: 12, color: palette.textMuted }}>{yieldHint}</span>
                    </div>

                    <div className='flex flex-col'>
                        <span style={{ fontSize: 13, color: palette.textMuted }}>
                            Рост цены бумаг: {pct1(goal.priceGrowthPct)} / год
                        </span>
                        <Slider
                            value={goal.priceGrowthPct}
                            onChange={(v) => setGoal({ priceGrowthPct: v })}
                            min={0}
                            max={20}
                            step={0.5}
                        />
                        <span style={{ fontSize: 12, color: palette.textMuted, marginTop: -4 }}>
                            курсовой рост котировок сверх выплат
                        </span>
                    </div>

                    <div className='flex flex-col'>
                        <span style={{ fontSize: 13, color: palette.textMuted }}>
                            Рост выплат: {pct1(goal.incomeGrowthPct)} / год
                        </span>
                        <Slider
                            value={goal.incomeGrowthPct}
                            onChange={(v) => setGoal({ incomeGrowthPct: v })}
                            min={0}
                            max={20}
                            step={0.5}
                        />
                        <span style={{ fontSize: 12, color: palette.textMuted, marginTop: -4 }}>
                            эмитенты ежегодно повышают дивиденды/купоны
                        </span>
                    </div>

                    <div className='flex flex-col'>
                        <span style={{ fontSize: 13, color: palette.textMuted }}>
                            Инфляция: {pct1(goal.inflationPct)} / год
                        </span>
                        <Slider
                            value={goal.inflationPct}
                            onChange={(v) => setGoal({ inflationPct: v })}
                            min={0}
                            max={20}
                            step={0.5}
                        />
                        <span style={{ fontSize: 12, color: palette.textMuted, marginTop: -4 }}>
                            график и цель — в сегодняшних рублях
                        </span>
                    </div>

                    <label className='flex items-center justify-between'>
                        <span style={{ fontSize: 13, color: palette.textMuted }}>Реинвестировать выплаты</span>
                        <Switch checked={goal.reinvest} onChange={(v) => setGoal({ reinvest: v })} />
                    </label>
                </Card>

                {/* Правая колонка: график + годовая разбивка под ним (заполняет высоту
                    рядом с высокой формой параметров, на мобиле складывается вниз). */}
                <div
                    style={{ flex: '3 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                {/* График траектории дохода */}
                <Card
                    size='small'
                    title='Рост пассивного дохода'
                    extra={<span style={{ fontSize: 12, color: palette.textMuted }}>в сегодняшних рублях</span>}
                    styles={{ body: { padding: 8 } }}
                >
                    <ReactECharts option={chartOption} style={{ height: 320 }} notMerge lazyUpdate />
                </Card>

            {/* Годовая разбивка капитала и дохода */}
            {yearRows.length ? (
                <Card
                    size='small'
                    title='Капитал по годам'
                    extra={<span style={{ fontSize: 12, color: palette.textMuted }}>в сегодняшних рублях</span>}
                    styles={{ body: { padding: 0 } }}
                >
                    <div style={{ maxHeight: 360, overflowY: 'auto', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ color: palette.textMuted, textAlign: 'left' }}>
                                    <th style={{ padding: '8px 12px', fontWeight: 400, position: 'sticky', top: 0, background: palette.containerBg }}>
                                        Год
                                    </th>
                                    <th style={{ padding: '8px 12px', fontWeight: 400, textAlign: 'right', position: 'sticky', top: 0, background: palette.containerBg }}>
                                        Капитал
                                    </th>
                                    <th style={{ padding: '8px 12px', fontWeight: 400, textAlign: 'right', position: 'sticky', top: 0, background: palette.containerBg }}>
                                        Доход ₽/мес
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {yearRows.map((row) => (
                                    <tr key={row.month} style={{ borderTop: `1px solid ${palette.border}` }}>
                                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                                            <span style={{ fontWeight: 500 }}>{row.yearLabel}</span>{' '}
                                            <span style={{ color: palette.textMuted, fontSize: 12 }}>{row.agoLabel}</span>
                                        </td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            {rub(row.capital)}
                                        </td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            <div style={{ color: row.share >= 100 ? '#1baf7a' : 'inherit' }}>
                                                {rub(row.monthlyIncome)}
                                            </div>
                                            <div style={{ color: palette.textMuted, fontSize: 12 }}>
                                                {Math.round(row.share)}% цели
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : null}
                </div>
            </div>

            <p style={{ fontSize: 12, color: palette.textMuted, marginTop: 4 }}>
                Прогноз считается только по платящим бумагам (крипта, валюта и кэш не участвуют) при
                постоянной доходности и росте; доход и капитал приведены к сегодняшним рублям с учётом
                инфляции. Это грубая оценка, а не инвестиционная рекомендация.
            </p>
        </div>
    );
};

export default GoalView;
