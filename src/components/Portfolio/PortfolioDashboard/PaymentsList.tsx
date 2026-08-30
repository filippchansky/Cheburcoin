'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Grid, Tooltip } from 'antd';
import { CalendarEvent, CalendarKind } from '@/hooks/usePaymentsCalendar';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { formatAmount, intToRub } from '@/utils/formatCurrency';
import { formatDayShort, formatDayWeekday, formatMonthTitle } from '@/utils/dateUtils';
import ShareLogo from '@/components/ShareLogo/ShareLogo';
import s from './style.module.scss';

/** Размер порции: столько строк добавляем за один шаг подгрузки при скролле. */
const PAGE = 20;

export const POSITIVE_COLOR = '#1baf7a';
export const NEGATIVE_COLOR = '#e24b4a';
const COUPON_COLOR = '#1baf7a';
const DIVIDEND_COLOR = '#4098fc';

const KIND_META: Record<CalendarKind, { label: string; color: string }> = {
    coupon: { label: 'Купон', color: COUPON_COLOR },
    dividend: { label: 'Дивиденд', color: DIVIDEND_COLOR }
};

/** Одна группа-месяц: ключ «YYYY-MM», знаковый рублёвый итог и строки. */
export interface MonthGroup<T> {
    key: string;
    total: number;
    items: T[];
}

/** Группирует уже отсортированный список по месяцу с рублёвым итогом группы. */
export const groupByMonth = <T,>(
    items: T[],
    monthKey: (item: T) => string,
    rubAmount: (item: T) => number
): MonthGroup<T>[] => {
    const groups: MonthGroup<T>[] = [];
    const index = new Map<string, number>();
    items.forEach((item) => {
        const key = monthKey(item);
        let gi = index.get(key);
        if (gi === undefined) {
            gi = groups.length;
            index.set(key, gi);
            groups.push({ key, total: 0, items: [] });
        }
        groups[gi].items.push(item);
        groups[gi].total += rubAmount(item);
    });
    return groups;
};

interface MonthGroupedListProps<T> {
    /** Строки в нужном порядке — группировка идёт как есть, без пересортировки. */
    items: T[];
    /** Ключ месяца строки, «YYYY-MM». */
    monthKey: (item: T) => string;
    /** Рублёвая сумма строки для итога месяца (валюта без курса → 0). */
    rubAmount: (item: T) => number;
    rowKey: (item: T) => string;
    renderRow: (item: T) => React.ReactNode;
    /** Смена значения сбрасывает подгруженные порции — напр. при смене фильтра. */
    resetKey?: string;
    pageSize?: number;
}

/**
 * Общий каркас списка выплат: карточка на месяц, липкий заголовок с названием
 * месяца и итогом, порционный показ строк. Разметку строки задаёт вызывающий —
 * так один каркас обслуживает и календарь будущих выплат, и историю.
 */
export function MonthGroupedList<T>({
    items,
    monthKey,
    rubAmount,
    rowKey,
    renderRow,
    resetKey,
    pageSize = PAGE
}: MonthGroupedListProps<T>) {
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const [visible, setVisible] = React.useState(pageSize);
    const sentinelRef = React.useRef<HTMLDivElement>(null);
    const hasMore = visible < items.length;

    // Фильтры меняют состав списка — начинаем показ заново, иначе после сужения
    // выборки остаётся «съеденная» прошлым скроллом порция.
    React.useEffect(() => setVisible(pageSize), [resetKey, pageSize]);

    // Подгрузка при скролле: маячок в конце списка входит в зону видимости (с
    // запасом в пол-экрана) — добавляем следующую порцию. visible в зависимостях
    // обязателен: после дорисовки маячок уезжает вниз и наблюдение нужно завести
    // заново, иначе следующая порция не запросится.
    React.useEffect(() => {
        const node = sentinelRef.current;
        if (!hasMore || !node) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setVisible((v) => v + pageSize);
            },
            { rootMargin: '400px 0px' }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [hasMore, pageSize, visible]);

    const groups = groupByMonth(items.slice(0, visible), monthKey, rubAmount);

    return (
        <div
            className={s.payList}
            style={{
                ['--rowBorder' as string]: palette.border,
                ['--rowBg' as string]: palette.layoutBg,
                ['--cardBg' as string]: palette.containerBg,
                ['--muted' as string]: palette.textMuted
            }}
        >
            {groups.map((group) => {
                const positive = group.total >= 0;
                return (
                    <div className={s.monthBlock} key={group.key}>
                        <div className={s.monthHead}>
                            <span className={s.monthName}>{formatMonthTitle(group.key)}</span>
                            <span
                                className={s.monthTotal}
                                style={{
                                    color: positive ? POSITIVE_COLOR : NEGATIVE_COLOR,
                                    background: positive
                                        ? 'rgba(27,175,122,0.12)'
                                        : 'rgba(226,75,74,0.12)'
                                }}
                            >
                                {positive ? '+' : ''}
                                {intToRub(group.total)}
                            </span>
                        </div>
                        <div className={s.monthCard}>
                            {group.items.map((item) => (
                                <React.Fragment key={rowKey(item)}>{renderRow(item)}</React.Fragment>
                            ))}
                        </div>
                    </div>
                );
            })}
            {hasMore ? <div ref={sentinelRef} className={s.sentinel} aria-hidden /> : null}
        </div>
    );
}

const isRubCurrency = (currency: string | null) =>
    !currency || ['rub', 'sur', 'RUB', 'SUR'].includes(currency);

/** Оригинальная сумма в валюте выплаты, напр. «12,00 $». */
const formatForeign = (amount: number, currency: string | null) => formatAmount(amount, currency);

/**
 * Основная сумма строкой: рубли (в т.ч. пересчёт валюты по курсу ЦБ); для
 * валюты с неизвестным курсом (amountRub == 0) — показываем оригинал.
 */
export const formatEventAmount = (event: CalendarEvent) =>
    isRubCurrency(event.currency) || event.amountRub > 0
        ? intToRub(event.amountRub)
        : formatForeign(event.amount, event.currency);

/** Подпись с оригинальной валютой — только для пересчитанных валютных выплат. */
export const foreignHint = (event: CalendarEvent) =>
    !isRubCurrency(event.currency) && event.amountRub > 0
        ? formatForeign(event.amount, event.currency)
        : null;

/** Процент в ru-формате: 3.112 → «3,11%». */
const formatPct = (n: number) =>
    `${n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

/** Куда ведёт клик по строке: купон → страница облигации, дивиденд → акции/фонда. */
const eventHref = (event: CalendarEvent) => {
    if (!event.ticker) return null;
    return event.kind === 'coupon' ? `/bonds/${event.ticker}` : `/moex/${event.ticker}`;
};

/** «48 × 31,12 ₽» — из чего сложилась сумма выплаты. */
const perUnitLine = (event: CalendarEvent) =>
    event.amountPerUnit
        ? `${event.quantity} × ${formatAmount(event.amountPerUnit, event.currency)}`
        : `${event.quantity} шт`;

/** «Каждые 30 дн» — периодичность выплат по бумаге. */
const periodLabel = (event: CalendarEvent) =>
    event.periodDays ? `Каждые ${event.periodDays} дн` : '—';

/** Тип выплаты + пометка прогноза: «● Купон», «● Дивиденд · прогноз». */
const StatusLine: React.FC<{ event: CalendarEvent }> = ({ event }) => {
    const meta = KIND_META[event.kind];
    const line = (
        <span className={s.payStatus}>
            <i className={s.statusDot} style={{ background: meta.color }} />
            {meta.label}
            {event.projected ? ' · прогноз' : ''}
        </span>
    );
    return event.projected ? (
        <Tooltip title='Оценка по прошлым выплатам эмитента — официально не объявлена'>
            {line}
        </Tooltip>
    ) : (
        line
    );
};

interface MetricProps {
    value: string;
    label: string;
    /** Подсказка под пунктирной подписью — как в Snowball. */
    hint?: string;
    className?: string;
}

/** Значение + подпись под ним (колонки «доходность», «к средней», «отсечка»). */
const Metric: React.FC<MetricProps> = ({ value, label, hint, className }) => (
    <div className={`${s.payCell} ${className ?? ''}`}>
        <span className={s.payCellValue}>{value}</span>
        {hint ? (
            <Tooltip title={hint}>
                <span className={`${s.payCellLabel} ${s.payCellHinted}`}>{label}</span>
            </Tooltip>
        ) : (
            <span className={s.payCellLabel}>{label}</span>
        )}
    </div>
);

interface EventRowProps {
    event: CalendarEvent;
    isMobile: boolean;
    onOpen: (event: CalendarEvent) => void;
}

/**
 * Строка выплаты: на десктопе — колонки (инструмент / дата / сумма / частота /
 * доходность / к средней / отсечка), на мобильных — компактная карточка.
 */
const EventRow: React.FC<EventRowProps> = ({ event, isMobile, onOpen }) => {
    const hint = foreignHint(event);
    // Доходность выплаты считаем в валюте бумаги: и цена позиции, и купон с
    // дивидендом приходят от Т-Банка в ней же, поэтому курс тут не нужен.
    const yieldPct = event.price ? (event.amountPerUnit / event.price) * 100 : null;
    const toAvgPct = event.avgPrice ? (event.amountPerUnit / event.avgPrice) * 100 : null;
    const clickable = !!eventHref(event);

    const logo = (
        <ShareLogo icon={event.isin ?? ''} ticker={event.ticker ?? ''} size={isMobile ? 40 : 36} />
    );

    if (isMobile) {
        return (
            <div
                className={`${s.payRow} ${clickable ? s.payRowClickable : ''}`}
                onClick={() => onOpen(event)}
            >
                <div className={s.payHead}>
                    <span className={s.payDate}>{formatDayWeekday(event.date)}</span>
                    <StatusLine event={event} />
                </div>
                <div className={s.payBody}>
                    {logo}
                    <div className={s.payInfo}>
                        <span className={s.payName}>{event.name ?? event.ticker ?? '—'}</span>
                        <span className={s.paySub}>
                            {yieldPct !== null ? `${formatPct(yieldPct)} · ` : ''}
                            {perUnitLine(event)}
                        </span>
                    </div>
                    <div className={s.payAmount}>
                        <span className={s.payAmountValue} style={{ color: POSITIVE_COLOR }}>
                            +{formatEventAmount(event)}
                        </span>
                        {hint ? <span className={s.payCellLabel}>{hint}</span> : null}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`${s.payGridRow} ${clickable ? s.payRowClickable : ''}`}
            onClick={() => onOpen(event)}
        >
            <div className={s.payInstrument}>
                {logo}
                <div className={s.payInfo}>
                    <span className={s.payName}>{event.name ?? event.ticker ?? '—'}</span>
                    <span className={s.paySub}>{event.isin ?? event.ticker ?? ''}</span>
                </div>
            </div>

            <div className={s.payCell}>
                <span className={s.payCellValue}>{formatDayShort(event.date)}</span>
                <StatusLine event={event} />
            </div>

            <div className={s.payCell}>
                <span className={s.payAmountValue} style={{ color: POSITIVE_COLOR }}>
                    +{formatEventAmount(event)}
                </span>
                <span className={s.payCellLabel}>
                    {hint ? `${hint} · ${perUnitLine(event)}` : perUnitLine(event)}
                </span>
            </div>

            <div className={`${s.payCell} ${s.colFreq}`}>
                <span className={s.payCellValue}>{periodLabel(event)}</span>
            </div>

            <Metric
                className={s.colYield}
                value={yieldPct !== null ? formatPct(yieldPct) : '—'}
                label='доходность'
                hint='Размер выплаты к текущей цене бумаги'
            />

            <Metric
                className={s.colAvg}
                value={toAvgPct !== null ? formatPct(toAvgPct) : '—'}
                label='к средней'
                hint='Размер выплаты к вашей средней цене покупки'
            />

            <Metric
                className={s.colFix}
                value={event.fixDate ? formatDayShort(event.fixDate) : '—'}
                label='отсечка'
                hint='Держатель бумаги на эту дату получает выплату; после неё покупка права на неё уже не даёт'
            />
        </div>
    );
};

interface PaymentsListProps {
    /** Отфильтрованные события — порядок задаёт вызывающий. */
    events: CalendarEvent[];
    /** Сигнатура фильтров: её смена сбрасывает порционный показ. */
    resetKey?: string;
}

/** Список будущих выплат по месяцам (общий для десктопа и мобильных). */
const PaymentsList: React.FC<PaymentsListProps> = ({ events, resetKey }) => {
    const screens = Grid.useBreakpoint();
    const isMobile = screens.md === false;
    const router = useRouter();

    const open = (event: CalendarEvent) => {
        const href = eventHref(event);
        if (href) router.push(href);
    };

    return (
        <MonthGroupedList<CalendarEvent>
            items={events}
            monthKey={(event) => event.date.slice(0, 7)}
            rubAmount={(event) => event.amountRub}
            rowKey={(event) => event.id}
            resetKey={resetKey}
            renderRow={(event) => <EventRow event={event} isMobile={isMobile} onOpen={open} />}
        />
    );
};

export default PaymentsList;
