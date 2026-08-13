import { NextResponse } from 'next/server';

const ISS_URL =
    'https://iss.moex.com/iss/engines/futures/markets/forts/securities.json' +
    '?iss.meta=off&iss.only=securities,marketdata' +
    '&securities.columns=SECID,ASSETCODE,LASTTRADEDATE,SHORTNAME' +
    '&marketdata.columns=SECID,LAST,LASTTOPREVPRICE';

interface FuturesQuote {
    secid: string;
    name: string;
    price: number;
    /** Изменение за день, % (marketdata LASTTOPREVPRICE). */
    changePct: number;
}

const indexer = (columns: string[]) => (column: string) => columns.indexOf(column);

/**
 * Котировки фьючерсов для ленты главной: доллар и юань — вечные фьючерсы
 * USDRUBF/CNYRUBF (стабильные тикеры), нефть — ближайший активный контракт Brent
 * (ASSETCODE='BR'; месячные тикеры экспирируются, поэтому подбираем на лету).
 * Один запрос к ISS даёт и securities (тикеры/даты), и marketdata (цены/%).
 */
export async function GET() {
    try {
        const response = await fetch(ISS_URL, { next: { revalidate: 300 } });
        if (!response.ok) {
            return NextResponse.json({ error: 'iss unavailable' }, { status: 502 });
        }

        const data = await response.json();

        const sCol = indexer(data.securities.columns);
        const mCol = indexer(data.marketdata.columns);
        const secs: unknown[][] = data.securities.data;
        const market = new Map<string, unknown[]>();
        for (const row of data.marketdata.data as unknown[][]) {
            market.set(String(row[mCol('SECID')]), row);
        }

        const nameBySecid = new Map<string, string>();
        for (const row of secs) {
            nameBySecid.set(String(row[sCol('SECID')]), String(row[sCol('SHORTNAME')] ?? ''));
        }

        const quote = (secid: string): FuturesQuote | null => {
            const row = market.get(secid);
            const price = row ? Number(row[mCol('LAST')]) : 0;
            if (!price) return null; // не торгуется / нет сделок
            return {
                secid,
                name: nameBySecid.get(secid) ?? secid,
                price,
                changePct: Number(row![mCol('LASTTOPREVPRICE')]) || 0
            };
        };

        // Ближайший активный контракт Brent: ASSETCODE='BR', дата экспирации не в прошлом.
        const today = new Date().toISOString().split('T')[0];
        const brentSecids = secs
            .filter((row) => row[sCol('ASSETCODE')] === 'BR')
            .map((row) => ({
                secid: String(row[sCol('SECID')]),
                expiry: String(row[sCol('LASTTRADEDATE')] ?? '')
            }))
            .filter((item) => item.expiry >= today)
            .sort((a, b) => a.expiry.localeCompare(b.expiry));

        const brentQuote =
            brentSecids.map((item) => quote(item.secid)).find((q) => q !== null) ?? null;

        return NextResponse.json({
            usd: quote('USDRUBF'),
            cny: quote('CNYRUBF'),
            brent: brentQuote
        });
    } catch {
        return NextResponse.json({ error: 'failed to fetch futures' }, { status: 502 });
    }
}
