import { NextResponse } from 'next/server';

/** Состав IMOEX — берём тикеры, по которым проверяем объявленные дивиденды. */
const COMPOSITION_URL =
    'https://iss.moex.com/iss/statistics/engines/stock/markets/index/analytics/IMOEX.json' +
    '?iss.meta=off&iss.only=analytics&limit=100';

const dividendsUrl = (secid: string) =>
    `https://iss.moex.com/iss/securities/${secid}/dividends.json?iss.meta=off`;

export interface DividendEvent {
    ticker: string;
    /** Дата закрытия реестра (отсечка), YYYY-MM-DD. */
    date: string;
    /** Дивиденд на акцию. */
    value: number;
    currency: string;
}

const indexer = (columns: string[]) => (column: string) => columns.indexOf(column);

/**
 * Календарь ближайших дивидендных отсечек по бумагам индекса IMOEX. ISS не отдаёт
 * глобального календаря, поэтому опрашиваем /securities/{secid}/dividends по каждой
 * бумаге и оставляем строки с датой закрытия реестра сегодня-или-в-будущем.
 * Пусто = эмитенты ещё не объявили выплаты (типичная ситуация вне дивидендного сезона).
 * Тяжёлый веер запросов кешируем на 6 часов.
 */
export async function GET() {
    try {
        const compRes = await fetch(COMPOSITION_URL, { next: { revalidate: 21600 } });
        if (!compRes.ok) {
            return NextResponse.json({ error: 'iss unavailable' }, { status: 502 });
        }

        const comp = (await compRes.json()).analytics;
        const cCol = indexer(comp.columns);
        const secids: string[] = (comp.data as unknown[][]).map((row) =>
            String(row[cCol('secids')] ?? row[cCol('ticker')])
        );

        const today = new Date().toISOString().split('T')[0];

        const perTicker = await Promise.all(
            secids.map(async (secid): Promise<DividendEvent[]> => {
                try {
                    const res = await fetch(dividendsUrl(secid), { next: { revalidate: 21600 } });
                    if (!res.ok) return [];
                    const div = (await res.json()).dividends;
                    const dCol = indexer(div.columns);
                    return (div.data as unknown[][])
                        .map((row) => ({
                            ticker: secid,
                            date: String(row[dCol('registryclosedate')] ?? ''),
                            value: Number(row[dCol('value')]) || 0,
                            currency: String(row[dCol('currencyid')] ?? 'RUB')
                        }))
                        .filter((e) => e.date >= today);
                } catch {
                    return [];
                }
            })
        );

        const items = perTicker
            .flat()
            .sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({ items });
    } catch {
        return NextResponse.json({ error: 'failed to fetch dividends calendar' }, { status: 502 });
    }
}
