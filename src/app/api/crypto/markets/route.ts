import { NextRequest, NextResponse } from 'next/server';
import { cgFetch, parseVs } from '@/lib/coingecko';
import type { ICoinMarket } from '@models/crypto';

/**
 * Таблица рынка: топ монет по капитализации одним запросом к CoinGecko
 * `/coins/markets` (цена, капа, объём, изменения 1ч/24ч/7д, спарклайн 7д).
 * Query: vs=rub|usd, page, per_page. Кэш 30с — цены «живые», но лимит demo-ключа
 * бережём.
 */
export async function GET(req: NextRequest) {
    try {
        const params = req.nextUrl.searchParams;
        const vs = parseVs(params.get('vs'));
        const page = Number(params.get('page')) || 1;
        const perPage = Math.min(Number(params.get('per_page')) || 100, 250);

        const path =
            `/coins/markets?vs_currency=${vs}&order=market_cap_desc` +
            `&per_page=${perPage}&page=${page}&sparkline=true` +
            `&price_change_percentage=1h,24h,7d`;

        const res = await cgFetch(path, 30);
        if (!res.ok) {
            return NextResponse.json({ error: `coingecko ${res.status}` }, { status: 502 });
        }

        const raw = (await res.json()) as any[];
        const items: ICoinMarket[] = raw.map((c) => ({
            id: c.id,
            symbol: (c.symbol ?? '').toUpperCase(),
            name: c.name,
            icon: c.image,
            rank: c.market_cap_rank ?? null,
            price: c.current_price ?? 0,
            marketCap: c.market_cap ?? null,
            volume: c.total_volume ?? null,
            priceChange1h: c.price_change_percentage_1h_in_currency ?? null,
            priceChange24h: c.price_change_percentage_24h_in_currency ?? null,
            priceChange7d: c.price_change_percentage_7d_in_currency ?? null,
            sparkline: c.sparkline_in_7d?.price ?? []
        }));

        return NextResponse.json({ items });
    } catch {
        return NextResponse.json({ error: 'failed to fetch markets' }, { status: 502 });
    }
}
