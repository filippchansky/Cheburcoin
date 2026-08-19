import { NextRequest, NextResponse } from 'next/server';
import { cgFetch, parseVs } from '@/lib/coingecko';
import type { IGlobalMarket } from '@models/crypto';

/**
 * Верхняя полоса рынка: общая капитализация, объём 24ч, доминация BTC/ETH
 * (CoinGecko `/global`). Query vs=rub|usd — из него берём валюту для капы/объёма.
 * Кэш 60с.
 */
export async function GET(req: NextRequest) {
    try {
        const vs = parseVs(req.nextUrl.searchParams.get('vs'));

        const res = await cgFetch('/global', 60);
        if (!res.ok) {
            return NextResponse.json({ error: `coingecko ${res.status}` }, { status: 502 });
        }

        const { data } = await res.json();
        const result: IGlobalMarket = {
            marketCap: data.total_market_cap?.[vs] ?? 0,
            volume: data.total_volume?.[vs] ?? 0,
            marketCapChange24h: data.market_cap_change_percentage_24h_usd ?? 0,
            btcDominance: data.market_cap_percentage?.btc ?? 0,
            ethDominance: data.market_cap_percentage?.eth ?? 0
        };

        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ error: 'failed to fetch global' }, { status: 502 });
    }
}
