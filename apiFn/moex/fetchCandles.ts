import { apiMoex } from './instance';

interface CandlesRaw {
    candles: {
        columns: string[];
        data: unknown[][];
    };
}

/** ISS отдаёт свечи страницами по 500 строк, сдвиг — параметр `start`. */
const PAGE_SIZE = 500;
/** Предохранитель от бесконечного цикла (500 × 40 = 20 000 свечей ≈ 55 лет дневных). */
const MAX_PAGES = 40;

/**
 * Тянет свечи MOEX за период целиком, проходя по всем страницам пагинации.
 * ISS ограничивает ответ 500 строками на страницу — без обхода `start` длинные
 * периоды молча обрезаются. Возвращает сырой колоночный формат; маппинг —
 * на стороне конкретного геттера (акции/облигации отличаются набором колонок).
 *
 * `market`: `shares` — акции, `bonds` — облигации.
 */
export const fetchCandlesRaw = async (
    market: 'shares' | 'bonds',
    secid: string,
    from: string,
    till: string,
    interval: string
): Promise<{ columns: string[]; data: unknown[][] }> => {
    const base =
        `iss/engines/stock/markets/${market}/securities/${secid}/candles.json` +
        `?from=${from}&till=${till}&interval=${interval}&iss.meta=off`;

    let columns: string[] = [];
    const data: unknown[][] = [];

    for (let page = 0; page < MAX_PAGES; page += 1) {
        const { data: raw } = await apiMoex.get<CandlesRaw>(`${base}&start=${page * PAGE_SIZE}`);
        const rows = raw.candles?.data ?? [];
        if (!columns.length) columns = raw.candles?.columns ?? [];
        data.push(...rows);
        // Неполная страница — данные закончились.
        if (rows.length < PAGE_SIZE) break;
    }

    return { columns, data };
};
