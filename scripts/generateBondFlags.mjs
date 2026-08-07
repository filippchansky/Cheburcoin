// @ts-check
/**
 * Генерация статической карты признаков надёжности облигаций для сборки (вариант B).
 *
 * Флаги ISQUALIFIEDINVESTORS / HASDEFAULT / HASTECHNICALDEFAULT MOEX отдаёт только в
 * карточке /iss/securities/{secid} (в списочном эндпоинте их нет, bulk-эндпоинта нет).
 * Гонять ~1700 карточек в рантайме на serverless нельзя, поэтому обходим их один раз
 * на этапе `next build` и кладём результат в public/bonds-flags.json — статикой.
 * Клиент читает готовый файл, никакой серверной логики.
 *
 * Устойчивость к сбою — приоритет: скрипт НИКОГДА не роняет сборку. При сетевой ошибке
 * пишет пустую карту (фильтры «квал/дефолт» тогда просто ничего не отсекают) и выходит с 0.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MOEX_BASE = (process.env.NEXT_PUBLIC_MOEX_API ?? 'https://iss.moex.com/').replace(
    /\/?$/,
    '/'
);
const BOND_BOARDS = ['TQOB', 'TQCB'];
const BATCH_SIZE = 30;

const OUT_PATH = join(
    dirname(dirname(fileURLToPath(import.meta.url))),
    'public',
    'bonds-flags.json'
);

/** Индекс колонки по имени в «колоночном» ответе MOEX ISS. */
const colIndex = (columns, name) => columns.indexOf(name);

/** secid ликвидных бумаг одного борда: те, у кого в marketdata есть цена LAST. */
const getLiquidSecids = async (board) => {
    const res = await fetch(
        `${MOEX_BASE}iss/engines/stock/markets/bonds/boards/${board}/securities.json?iss.meta=off`
    );
    if (!res.ok) throw new Error(`board ${board}: HTTP ${res.status}`);
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
        .filter((secid) => priced.has(secid));
};

/** Флаги надёжности из карточки одной бумаги; при ошибке — undefined. */
const fetchFlags = async (secid) => {
    try {
        const res = await fetch(
            `${MOEX_BASE}iss/securities/${secid}.json?iss.meta=off&iss.only=description`
        );
        if (!res.ok) return undefined;
        const json = await res.json();
        const desc = json.description;
        if (!desc) return undefined;

        const nameIdx = colIndex(desc.columns, 'name');
        const valueIdx = colIndex(desc.columns, 'value');
        const byName = new Map(desc.data.map((row) => [String(row[nameIdx]), String(row[valueIdx] ?? '')]));

        return {
            qualified: byName.get('ISQUALIFIEDINVESTORS') === '1',
            hasDefault:
                byName.get('HASDEFAULT') === '1' || byName.get('HASTECHNICALDEFAULT') === '1'
        };
    } catch {
        return undefined;
    }
};

const write = async (flags) => {
    await mkdir(dirname(OUT_PATH), { recursive: true });
    await writeFile(OUT_PATH, JSON.stringify(flags));
};

const main = async () => {
    const started = Date.now();
    try {
        const perBoard = await Promise.all(BOND_BOARDS.map(getLiquidSecids));
        const secids = [...new Set(perBoard.flat())];
        console.log(`[flags] ликвидных бумаг: ${secids.length}, обходим карточки…`);

        const flags = {};
        for (let i = 0; i < secids.length; i += BATCH_SIZE) {
            const batch = secids.slice(i, i + BATCH_SIZE);
            const results = await Promise.all(batch.map((secid) => fetchFlags(secid)));
            batch.forEach((secid, j) => {
                if (results[j]) flags[secid] = results[j];
            });
        }

        const qual = Object.values(flags).filter((f) => f.qualified).length;
        const def = Object.values(flags).filter((f) => f.hasDefault).length;
        await write(flags);
        console.log(
            `[flags] готово: ${Object.keys(flags).length} бумаг (квал ${qual}, дефолт ${def}) за ${(
                (Date.now() - started) /
                1000
            ).toFixed(1)}с → public/bonds-flags.json`
        );
    } catch (err) {
        // Сборку не роняем: пишем пустую карту, фильтры деградируют в no-op.
        console.warn(`[flags] не удалось собрать флаги (${err?.message ?? err}); пишем пустую карту`);
        await write({});
    }
};

main();
