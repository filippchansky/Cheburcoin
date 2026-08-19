import { NextRequest, NextResponse } from 'next/server';
import { cgFetch, parseVs } from '@/lib/coingecko';
import type { ICoinDetail } from '@models/crypto';

/**
 * Полная карточка монеты: метаданные, ATH/ATL, supply, ссылки (CoinGecko
 * `/coins/{id}`). Тяжёлые блоки (tickers/community/dev) отключаем query-флагами.
 * Кэш 60с. Query vs=rub|usd — валюта числовых полей.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        if (!/^[a-z0-9-]{1,80}$/i.test(id)) {
            return NextResponse.json({ error: 'bad id' }, { status: 400 });
        }
        const vs = parseVs(req.nextUrl.searchParams.get('vs'));

        const path =
            `/coins/${id}?localization=false&tickers=false` +
            `&market_data=true&community_data=false&developer_data=false&sparkline=false`;

        const res = await cgFetch(path, 60);
        if (!res.ok) {
            return NextResponse.json({ error: `coingecko ${res.status}` }, { status: 502 });
        }

        const c = await res.json();
        const md = c.market_data ?? {};
        const links = c.links ?? {};

        const result: ICoinDetail = {
            id: c.id,
            symbol: (c.symbol ?? '').toUpperCase(),
            name: c.name,
            icon: c.image?.large ?? c.image?.small ?? '',
            rank: c.market_cap_rank ?? null,
            price: md.current_price?.[vs] ?? 0,
            marketCap: md.market_cap?.[vs] ?? null,
            volume: md.total_volume?.[vs] ?? null,
            high24h: md.high_24h?.[vs] ?? null,
            low24h: md.low_24h?.[vs] ?? null,
            priceChange1h: md.price_change_percentage_1h_in_currency?.[vs] ?? null,
            priceChange24h: md.price_change_percentage_24h_in_currency?.[vs] ?? null,
            priceChange7d: md.price_change_percentage_7d_in_currency?.[vs] ?? null,
            circulatingSupply: md.circulating_supply ?? null,
            totalSupply: md.total_supply ?? null,
            maxSupply: md.max_supply ?? null,
            ath: md.ath?.[vs] ?? null,
            athDate: md.ath_date?.[vs] ?? null,
            atl: md.atl?.[vs] ?? null,
            atlDate: md.atl_date?.[vs] ?? null,
            description: c.description?.en ?? '',
            websiteUrl: links.homepage?.find((u: string) => u) ?? null,
            twitterUrl: links.twitter_screen_name
                ? `https://twitter.com/${links.twitter_screen_name}`
                : null,
            redditUrl: links.subreddit_url || null,
            explorerUrl: links.blockchain_site?.find((u: string) => u) ?? null
        };

        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ error: 'failed to fetch coin' }, { status: 502 });
    }
}
