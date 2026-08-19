import { NextResponse } from 'next/server';
import { fetchRss, type RssSource } from '@/lib/rss';
import type { INewsItem } from '@models/crypto';

/**
 * Общая крипто-лента на русском. Сливаем несколько RU RSS-источников (без ключей,
 * без CORS — парсим XML на сервере), сортируем по свежести, чистим дубли по
 * заголовку. Кэш 10 мин — новости не «живые», а лимиты источников бережём.
 */
const SOURCES: RssSource[] = [
    { url: 'https://forklog.com/feed', name: 'ForkLog' },
    { url: 'https://incrypted.com/feed/', name: 'Incrypted' },
    { url: 'https://ru.investing.com/rss/news_301.rss', name: 'Investing.com' }
];

const REVALIDATE = 600;

export async function GET() {
    try {
        const lists = await Promise.all(SOURCES.map((s) => fetchRss(s, REVALIDATE)));

        const seen = new Set<string>();
        const items: INewsItem[] = lists
            .flat()
            .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
            .filter((item) => {
                const key = item.title.toLowerCase().slice(0, 60);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .slice(0, 24);

        return NextResponse.json({ items });
    } catch {
        return NextResponse.json({ error: 'failed to fetch news' }, { status: 502 });
    }
}
