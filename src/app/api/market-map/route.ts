import { NextResponse } from 'next/server';

/** Состав индекса Мосбиржи: тикеры и веса (free-float). PAGESIZE ISS=20 → limit=100. */
const COMPOSITION_URL =
    'https://iss.moex.com/iss/statistics/engines/stock/markets/index/analytics/IMOEX.json' +
    '?iss.meta=off&limit=100';

/** Дневное изменение по всем бумагам основного борта TQBR (LASTTOPREVPRICE = % к пред. закрытию). */
const MARKETDATA_URL =
    'https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json' +
    '?iss.meta=off&iss.only=marketdata' +
    '&marketdata.columns=SECID,LAST,LASTTOPREVPRICE';

export interface MarketMapItem {
    /** Тикер (он же secid борта TQBR). */
    ticker: string;
    /** Короткое название бумаги для тултипа. */
    name: string;
    /** Вес в индексе IMOEX, % (задаёт размер плитки). */
    weight: number;
    /** Изменение за день, % (задаёт цвет плитки). null — нет сделок сегодня. */
    changePct: number | null;
    /** Последняя цена, ₽ (для тултипа). */
    last: number | null;
}

const indexer = (columns: string[]) => (column: string) => columns.indexOf(column);

/**
 * Данные карты рынка для главной: 46 бумаг индекса IMOEX с весом (размер плитки)
 * и дневным изменением (цвет). Два запроса к MOEX ISS — состав индекса и marketdata
 * борта TQBR — джойнятся по secid. Кеш revalidate 60с (в торговые часы % «живой»).
 */
export async function GET() {
    try {
        const [compRes, mdRes] = await Promise.all([
            fetch(COMPOSITION_URL, { next: { revalidate: 60 } }),
            fetch(MARKETDATA_URL, { next: { revalidate: 60 } })
        ]);

        if (!compRes.ok || !mdRes.ok) {
            return NextResponse.json({ error: 'iss unavailable' }, { status: 502 });
        }

        const comp = (await compRes.json()).analytics;
        const md = (await mdRes.json()).marketdata;

        const cCol = indexer(comp.columns);
        const mCol = indexer(md.columns);

        // Индекс дневного % и цены по secid борта TQBR.
        const change = new Map<string, { changePct: number | null; last: number | null }>();
        for (const row of md.data as unknown[][]) {
            const secid = String(row[mCol('SECID')]);
            const pct = row[mCol('LASTTOPREVPRICE')];
            const last = row[mCol('LAST')];
            change.set(secid, {
                changePct: pct === null || pct === '' ? null : Number(pct),
                last: last === null || last === '' ? null : Number(last)
            });
        }

        const items: MarketMapItem[] = (comp.data as unknown[][])
            .map((row) => {
                const secid = String(row[cCol('secids')] ?? row[cCol('ticker')]);
                const q = change.get(secid);
                return {
                    ticker: secid,
                    name: String(row[cCol('shortnames')] ?? secid),
                    weight: Number(row[cCol('weight')]) || 0,
                    changePct: q?.changePct ?? null,
                    last: q?.last ?? null
                };
            })
            .filter((item) => item.weight > 0)
            .sort((a, b) => b.weight - a.weight);

        return NextResponse.json({ items });
    } catch {
        return NextResponse.json({ error: 'failed to fetch market map' }, { status: 502 });
    }
}
