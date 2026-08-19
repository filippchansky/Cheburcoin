/**
 * Мини-парсер RSS 2.0 на регулярках (без внешней зависимости — как SOAP-ответ ЦБ
 * в key-rate). Русские крипто-издания (ForkLog, Incrypted, Investing RU) отдают
 * XML без CORS, поэтому дёргаем и разбираем их на сервере, отдавая клиенту простой
 * `INewsItem[]`. Картинку берём из `<enclosure>` либо из первого `<img>` в описании.
 */
import type { INewsItem } from '@models/crypto';

export interface RssSource {
    url: string;
    /** Имя, которое покажем как источник. */
    name: string;
}

/** Раскрываем CDATA и базовые HTML-сущности до плоского текста. */
const decodeText = (raw: string): string =>
    raw
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
        .replace(/\s+/g, ' ')
        .trim();

/** Содержимое первого тега `<name>…</name>` внутри блока (с CDATA или без). */
const pick = (block: string, name: string): string => {
    const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
    return m ? m[1].trim() : '';
};

/** Достаём URL картинки: enclosure/media → первый <img src> в описании. */
const pickImage = (block: string): string | null => {
    const enclosure = block.match(/<enclosure[^>]*url=["']([^"']+)["']/i);
    if (enclosure) return enclosure[1];
    const media = block.match(/<media:(?:content|thumbnail)[^>]*url=["']([^"']+)["']/i);
    if (media) return media[1];
    const img = block.match(/<img[^>]*src=["']([^"']+)["']/i);
    if (img) return img[1];
    return null;
};

/** Разбирает один RSS-фид в новости. Битый фид → пустой список (не роняем ленту). */
export const parseRss = (xml: string, source: RssSource): INewsItem[] => {
    const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
    const result: INewsItem[] = [];

    for (const block of items) {
        const title = decodeText(pick(block, 'title'));
        const link = decodeText(pick(block, 'link') || (block.match(/<link[^>]*>([^<]+)/i)?.[1] ?? ''));
        if (!title || !link) continue;

        const pubDate = pick(block, 'pubDate');
        const parsed = pubDate ? new Date(pubDate) : null;
        const publishedAt =
            parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();

        // Картинку ищем в enclosure/media, затем в content:encoded и description.
        const imageUrl =
            pickImage(block) ??
            pickImage(pick(block, 'content:encoded')) ??
            pickImage(pick(block, 'description'));

        result.push({
            id: link,
            title,
            url: link,
            source: source.name,
            publishedAt,
            imageUrl
        });
    }

    return result;
};

/**
 * Тянет и парсит один источник; ошибку сети/парса глушим в пустой список.
 * Жёсткий таймаут (по умолчанию 8с): один зависший фид не должен держать всю
 * ленту — на некоторых хостах undici-fetch виснет до 60с, хотя curl отвечает сразу.
 */
export const fetchRss = async (
    source: RssSource,
    revalidate: number,
    timeoutMs = 6000
): Promise<INewsItem[]> => {
    try {
        const res = await fetch(source.url, {
            headers: { 'user-agent': 'Mozilla/5.0 (compatible; CheburcoinBot/1.0)' },
            signal: AbortSignal.timeout(timeoutMs),
            next: { revalidate }
        });
        if (!res.ok) return [];
        const xml = await res.text();
        return parseRss(xml, source);
    } catch {
        return [];
    }
};
