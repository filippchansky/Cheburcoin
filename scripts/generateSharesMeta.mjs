// @ts-nocheck
/**
 * Генерация статической карты дивидендов акций для сборки (тот же приём, что и
 * bonds-flags: карточные данные без bulk-эндпоинта обходим один раз на сборке).
 *
 * Историю дивидендов MOEX отдаёт только по одной бумаге: /iss/securities/{ticker}/dividends.
 * Гонять ~260 запросов в рантайме на serverless нельзя, поэтому считаем один раз на
 * этапе `next build` и кладём результат в public/shares-meta.json — статикой.
 *
 * ВАЖНО: в файл пишем ГОДОВОЙ ДИВИДЕНД НА АКЦИЮ (₽, стабильная величина), а НЕ
 * доходность — доходность зависит от текущей цены и плывёт каждый день, её считаем
 * на клиенте от живой цены из списка (annualDiv / price * 100). Так фильтр всегда свежий.
 *
 * Устойчивость к сбою — приоритет: скрипт НИКОГДА не роняет сборку. При сетевой ошибке
 * пишет пустую карту (фильтр по дивидендам тогда просто ничего не отсекает) и выходит с 0.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MOEX_BASE = (process.env.NEXT_PUBLIC_MOEX_API ?? 'https://iss.moex.com/').replace(
    /\/?$/,
    '/'
);
const BATCH_SIZE = 20;

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
// Насколько старой может быть последняя выплата, чтобы считать бумагу платящей дивиденды.
const STALE_DIVIDEND_MS = 1.5 * YEAR_MS;

const OUT_PATH = join(
    dirname(dirname(fileURLToPath(import.meta.url))),
    'public',
    'shares-meta.json'
);

/** Индекс колонки по имени в «колоночном» ответе MOEX ISS. */
const colIndex = (columns, name) => columns.indexOf(name);

/** Тикеры ликвидных акций TQBR: те, у кого в marketdata есть цена LAST. */
const getLiquidTickers = async () => {
    const res = await fetch(
        `${MOEX_BASE}iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off`
    );
    if (!res.ok) throw new Error(`TQBR securities: HTTP ${res.status}`);
    const json = await res.json();

    const secCols = json.securities.columns;
    const mktCols = json.marketdata.columns;
    const secidIdx = colIndex(secCols, 'SECID');
    const mktSecidIdx = colIndex(mktCols, 'SECID');
    const lastIdx = colIndex(mktCols, 'LAST');

    const priced = new Set();
    for (const row of json.marketdata.data) {
        const last = row[lastIdx];
        if (last !== null && last !== undefined && last !== '') priced.add(row[mktSecidIdx]);
    }

    return json.securities.data
        .map((row) => row[secidIdx])
        .filter((ticker) => priced.has(ticker));
};

/**
 * Годовой дивиденд на акцию (та же логика, что в src/utils/shareCalc.ts):
 * выплаты за 12 мес; вне «сезона» — окно, заканчивающееся датой самой свежей
 * выплаты; если последняя выплата старше 18 мес — 0 (бумага фактически не платит).
 * dividends отсортированы по дате убыв. ([0] — самая свежая).
 */
const annualDividendPerShare = (dividends) => {
    const now = Date.now();
    const trailing = dividends
        .filter((d) => now - new Date(d.date).getTime() <= YEAR_MS)
        .reduce((sum, d) => sum + d.value, 0);
    if (trailing > 0 || !dividends.length) return trailing;

    const latest = new Date(dividends[0].date).getTime();
    if (now - latest > STALE_DIVIDEND_MS) return 0;

    const windowStart = latest - YEAR_MS;
    return dividends
        .filter((d) => new Date(d.date).getTime() > windowStart)
        .reduce((sum, d) => sum + d.value, 0);
};

/** Годовой дивиденд + дата последней выплаты из карточки одной бумаги; при ошибке — undefined. */
const fetchDividends = async (ticker) => {
    try {
        const res = await fetch(
            `${MOEX_BASE}iss/securities/${ticker}/dividends.json?iss.meta=off`
        );
        if (!res.ok) return undefined;
        const json = await res.json();
        const div = json.dividends;
        if (!div || !div.data.length) return undefined;

        const dateIdx = colIndex(div.columns, 'registryclosedate');
        const valueIdx = colIndex(div.columns, 'value');
        const dividends = div.data
            .map((row) => ({
                date: String(row[dateIdx] ?? ''),
                value: Number(row[valueIdx]) || 0
            }))
            .filter((d) => d.date)
            .sort((a, b) => b.date.localeCompare(a.date));
        if (!dividends.length) return undefined;

        return {
            annualDiv: annualDividendPerShare(dividends),
            lastPayDate: dividends[0].date
        };
    } catch {
        return undefined;
    }
};

const write = async (meta) => {
    await mkdir(dirname(OUT_PATH), { recursive: true });
    await writeFile(OUT_PATH, JSON.stringify(meta));
};

const main = async () => {
    const started = Date.now();
    try {
        const tickers = await getLiquidTickers();
        console.log(`[shares-meta] ликвидных акций: ${tickers.length}, обходим дивиденды…`);

        const meta = {};
        for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
            const batch = tickers.slice(i, i + BATCH_SIZE);
            const results = await Promise.all(batch.map((ticker) => fetchDividends(ticker)));
            batch.forEach((ticker, j) => {
                if (results[j]) meta[ticker] = results[j];
            });
        }

        const paying = Object.values(meta).filter((m) => m.annualDiv > 0).length;
        await write(meta);
        console.log(
            `[shares-meta] готово: ${Object.keys(meta).length} бумаг с историей (платящих ${paying}) за ${(
                (Date.now() - started) /
                1000
            ).toFixed(1)}с → public/shares-meta.json`
        );
    } catch (err) {
        // Сборку не роняем: пишем пустую карту, фильтр по дивидендам деградирует в no-op.
        console.warn(
            `[shares-meta] не удалось собрать дивиденды (${err?.message ?? err}); пишем пустую карту`
        );
        await write({});
    }
};

main();
