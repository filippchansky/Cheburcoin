/**
 * Общий хелпер для серверных крипто-роутов: строит запрос к CoinGecko и прячет
 * demo-ключ на сервере (в браузер он не попадает, в отличие от старого CoinStats).
 *
 * Ключ опционален: публичный CoinGecko работает и без него (ниже рейт-лимит),
 * поэтому локально без ключа всё живёт — заголовок просто не шлём (как в blockbook).
 * С ключом бьём в demo-хост с заголовком `x-cg-demo-api-key`.
 */

const DEMO_BASE = 'https://api.coingecko.com/api/v3';

const KEY = process.env.COINGECKO_KEY;

/**
 * Запрос к CoinGecko. `revalidate` — TTL кэша Next в секундах (рынок «живой»,
 * поэтому короткий; метаданные монеты можно кэшировать дольше).
 */
export const cgFetch = async (path: string, revalidate: number): Promise<Response> =>
    fetch(`${DEMO_BASE}${path}`, {
        headers: {
            accept: 'application/json',
            ...(KEY ? { 'x-cg-demo-api-key': KEY } : {})
        },
        next: { revalidate }
    });

/** Клиентский период графика → параметр `days` CoinGecko. */
export const periodToDays: Record<string, string> = {
    '24h': '1',
    '1w': '7',
    '1m': '30',
    '3m': '90',
    '6m': '180',
    '1y': '365',
    all: 'max'
};

/** Валидируем vs_currency из query, чтобы не прокидывать произвольную строку. */
export const parseVs = (raw: string | null): 'rub' | 'usd' => (raw === 'usd' ? 'usd' : 'rub');
