'use client';
import React from 'react';
import Link from 'next/link';
import { BankOutlined, CalendarOutlined, WalletOutlined } from '@ant-design/icons';
import { CBR_MEETINGS } from '@/data/cbrMeetings';
import { DividendEvent, useDividendsCalendar } from '@/hooks/useMarketOverview';
import { formatMoney } from '@/utils/formatCurrency';
import style from './style.module.scss';

const MAX_EVENTS = 6;

type CalEvent =
    | { kind: 'cbr'; date: string }
    | { kind: 'div'; date: string; div: DividendEvent };

/** 'YYYY-MM-DD' → локальная дата без сдвига часового пояса. */
const toLocalDate = (iso: string): Date => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const DATE_FMT = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });
const WEEKDAY_FMT = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });

const EventRow: React.FC<{ event: CalEvent }> = ({ event }) => {
    const dateObj = toLocalDate(event.date);
    const badge = (
        <span className={style.calDate}>
            <span className={style.calDay}>{DATE_FMT.format(dateObj)}</span>
            <span className={style.calWeekday}>{WEEKDAY_FMT.format(dateObj)}</span>
        </span>
    );

    if (event.kind === 'cbr') {
        return (
            <div className={style.calRow}>
                {badge}
                <span className={`${style.calIcon} ${style.calIconCbr}`}>
                    <BankOutlined />
                </span>
                <span className={style.calText}>
                    <span className={style.calTitle}>Заседание ЦБ</span>
                    <span className={style.calSub}>решение по ключевой ставке</span>
                </span>
            </div>
        );
    }

    const { ticker, value, currency } = event.div;
    return (
        <Link className={style.calRow} href={`/moex/${ticker}`}>
            {badge}
            <span className={`${style.calIcon} ${style.calIconDiv}`}>
                <WalletOutlined />
            </span>
            <span className={style.calText}>
                <span className={style.calTitle}>{ticker} · дивидендная отсечка</span>
                <span className={style.calSub}>{formatMoney(value, currency)} на акцию</span>
            </span>
        </Link>
    );
};

/** Мини-виджет «Ближайшие события»: заседания ЦБ + дивидендные отсечки бумаг IMOEX. */
const HomeCalendar: React.FC = () => {
    const { data: dividends } = useDividendsCalendar();

    const events = React.useMemo<CalEvent[]>(() => {
        const todayIso = new Date().toISOString().split('T')[0];
        const cbr: CalEvent[] = CBR_MEETINGS.filter((d) => d >= todayIso).map((date) => ({
            kind: 'cbr',
            date
        }));
        const div: CalEvent[] = (dividends ?? []).map((d) => ({ kind: 'div', date: d.date, div: d }));
        return [...cbr, ...div].sort((a, b) => a.date.localeCompare(b.date)).slice(0, MAX_EVENTS);
    }, [dividends]);

    return (
        <div className={style.widgetCard}>
            <h3 className={style.widgetTitle}>
                <CalendarOutlined />
                Ближайшие события
            </h3>
            {events.length ? (
                <div className={style.calList}>
                    {events.map((e) => (
                        <EventRow key={`${e.kind}-${e.date}-${e.kind === 'div' ? e.div.ticker : ''}`} event={e} />
                    ))}
                </div>
            ) : (
                <span className={style.moverEmpty}>Ближайших событий нет</span>
            )}
        </div>
    );
};

export default HomeCalendar;
