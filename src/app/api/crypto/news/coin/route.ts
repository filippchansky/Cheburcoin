import { NextRequest, NextResponse } from 'next/server';
import type { INewsItem, NewsSentiment } from '@models/crypto';

/**
 * Новости по конкретной монете — CryptoPanic (фильтр `currencies=BTC` + уникальные
 * метки тональности по голосам сообщества). Ключ прячем на сервере как у CoinGecko:
 * `CRYPTOPANIC_KEY` без NEXT_PUBLIC. Без ключа отдаём пустую ленту (не 5xx) — блок
 * на детальной просто покажет заглушку «нет новостей», страница цела.
 */
const KEY = process.env.CRYPTOPANIC_KEY;
const BASE = 'https://cryptopanic.com/api/v1/posts/';

/** Голоса CryptoPanic → тональность. Перевес позитива/негатива, иначе нейтрально. */
const toSentiment = (votes: any): NewsSentiment => {
    const pos = Number(votes?.positive ?? 0) + Number(votes?.liked ?? 0);
    const neg = Number(votes?.negative ?? 0) + Number(votes?.disliked ?? 0);
    if (pos > neg) return 'bullish';
    if (neg > pos) return 'bearish';
    return 'neutral';
};

export async function GET(req: NextRequest) {
    const symbol = (req.nextUrl.searchParams.get('symbol') ?? '').toUpperCase().trim();
    if (!symbol) {
        return NextResponse.json({ error: 'symbol required' }, { status: 400 });
    }
    if (!KEY) {
        // Ключ не заведён — тихо отдаём пустую ленту, UI покажет заглушку.
        return NextResponse.json({ items: [], configured: false });
    }

    try {
        const url =
            `${BASE}?auth_token=${KEY}&public=true&currencies=${symbol}` +
            `&kind=news&regions=en,ru`;
        const res = await fetch(url, { next: { revalidate: 600 } });
        if (!res.ok) {
            return NextResponse.json({ items: [], configured: true });
        }

        const json = await res.json();
        const raw: any[] = Array.isArray(json?.results) ? json.results : [];

        const items: INewsItem[] = raw.map((p) => ({
            id: String(p.id),
            title: p.title ?? '',
            url: p.url ?? p.source?.url ?? '#',
            source: p.source?.title ?? p.domain ?? 'CryptoPanic',
            publishedAt: p.published_at ?? p.created_at ?? new Date().toISOString(),
            imageUrl: null,
            sentiment: toSentiment(p.votes)
        }));

        return NextResponse.json({ items, configured: true });
    } catch {
        return NextResponse.json({ items: [], configured: true });
    }
}
