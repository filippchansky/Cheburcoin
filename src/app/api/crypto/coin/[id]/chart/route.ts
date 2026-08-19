import { NextRequest, NextResponse } from 'next/server';
import { cgFetch, parseVs, periodToDays } from '@/lib/coingecko';
import type { ICoinChart } from '@models/crypto';

/**
 * Данные графика монеты (CoinGecko `/coins/{id}/market_chart`). Query:
 * vs=rub|usd, period=24h|1w|1m|3m|6m|1y|all → days. Кэш 60с.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        if (!/^[a-z0-9-]{1,80}$/i.test(id)) {
            return NextResponse.json({ error: 'bad id' }, { status: 400 });
        }
        const search = req.nextUrl.searchParams;
        const vs = parseVs(search.get('vs'));
        const days = periodToDays[search.get('period') ?? '1w'] ?? '7';

        const res = await cgFetch(
            `/coins/${id}/market_chart?vs_currency=${vs}&days=${days}`,
            60
        );
        if (!res.ok) {
            return NextResponse.json({ error: `coingecko ${res.status}` }, { status: 502 });
        }

        const data = await res.json();
        const result: ICoinChart = { prices: data.prices ?? [] };
        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ error: 'failed to fetch chart' }, { status: 502 });
    }
}
