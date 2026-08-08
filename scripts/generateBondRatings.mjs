// @ts-check
/**
 * Локальная генерация кредитных рейтингов облигаций из репозитария Банка России
 * (ratings.cbr.ru). Запускается ВРУЧНУЮ: `npm run ratings:sync` — результат
 * (public/bond-ratings.json) коммитится в репозиторий. Vercel в ЦБ НЕ ходит:
 * так мы не бьём госсайт на каждом деплое и не рискуем упереться в его капчу.
 *
 * Почему по ИНН, а не по ISIN: один запрос по ИНН отдаёт рейтинги и историю по
 * ВСЕМ выпускам эмитента → на ~1400 бумаг приходится ~300 эмитентов, кратно
 * меньше обращений. Но ИНН MOEX не отдаёт, поэтому ИНН по каждому ISIN узнаём
 * один раз запросом по ISIN (ISIN↔ИНН не меняется) и кэшируем навсегда.
 *
 * Эндпоинт ЦБ — служебный AJAX формы поиска (не публичный API): нужен Bitrix
 * CSRF-токен (первый POST возвращает его в ошибке, повторяем с заголовком).
 * Капча в форме есть, но при обычном темпе не требуется; троттлим из вежливости.
 *
 * Устойчивость: скрипт НИКОГДА не роняет процесс. Кэш пишется инкрементально —
 * прерванный прогон продолжается со следующего раза. При сбое просто останется
 * то, что успели собрать.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CBR_BASE = 'https://ratings.cbr.ru';
const CBR_AJAX = `${CBR_BASE}/bitrix/services/main/ajax.php?mode=ajax&c=prr.form&action=searchRating`;
const MOEX_BASE = (process.env.NEXT_PUBLIC_MOEX_API ?? 'https://iss.moex.com/').replace(/\/?$/, '/');
const BOND_BOARDS = ['TQOB', 'TQCB'];

const OUT_PATH = join(ROOT, 'public', 'bond-ratings.json');
const CACHE_PATH = join(ROOT, 'scripts', 'data', 'ratings-cache.json');

/** Пауза между «живыми» запросами к ЦБ, мс (вежливый троттлинг). */
const THROTTLE_MS = 250;
/** Сколько дней рейтинги эмитента считаются свежими (не перезапрашиваем). */
const ISSUER_TTL_DAYS = 14;

const UA = 'Mozilla/5.0 (Cheburcoin ratings sync; +https://github.com/) Chrome/126 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const colIndex = (columns, name) => columns.indexOf(name);

/** Человеко-понятная метка и «тон» по коду рейтингового действия ЦБ. */
const ACTION_LABELS = {
    NW: 'присвоен',
    AFF: 'подтверждён',
    UP: 'повышен',
    DOWN: 'понижен',
    RWN: 'под наблюдением',
    RWR: 'снят с наблюдения',
    WD: 'отозван',
    DEF: 'дефолт'
};

/** dd.MM.yyyy → yyyy-MM-dd (для сортировки и formatDate на клиенте). */
const toIso = (ddmmyyyy) => {
    const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(ddmmyyyy ?? '').trim());
    return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
};

/** Код действия («UP», «WD», …) из строки ЦБ вида «UP – повышение…». */
const actionCode = (raw) => {
    const m = /^([A-Z]{2,4})\b/.exec(String(raw ?? '').trim());
    return m ? m[1] : '';
};

/** Короткое имя агентства из полного (для компактных подписей). */
const shortAgency = (kraName) => {
    const s = String(kraName ?? '');
    if (/АКРА/i.test(s)) return 'АКРА';
    if (/Эксперт\s*РА/i.test(s)) return 'Эксперт РА';
    if (/НКР/i.test(s)) return 'НКР';
    if (/НРА/i.test(s)) return 'НРА';
    return s.replace(/\s*\(.*?\)\s*/g, '').trim();
};

/** Коды прогноза ЦБ → человеко-понятно (часть агентств отдаёт кодом, часть словом). */
const OUTLOOK_LABELS = {
    STA: 'Стабильный',
    POS: 'Позитивный',
    NEG: 'Негативный',
    DEV: 'Развивающийся',
    EVO: 'Развивающийся'
};

/** Прогноз: «NA …» → ''; код (STA/POS/…) → слово; иначе русское слово как есть. */
const cleanOutlook = (prediction) => {
    const s = String(prediction ?? '').trim();
    if (!s || /^NA\b/i.test(s)) return '';
    const parts = s.split(/\s*[–-]\s*/).map((p) => p.trim()).filter(Boolean);
    const word = parts.find((p) => /[а-яё]/i.test(p)); // «STA - Стабильный» / «Стабильный»
    if (word) return word;
    return OUTLOOK_LABELS[parts[0]?.toUpperCase()] ?? '';
};

/** ISIN из наименования объекта ЦБ («… ISIN: RU000A104JQ3, …»), иначе ''. */
const isinFromObjectName = (objectName) => {
    const m = /\bISIN[:\s]+([A-Z]{2}[A-Z0-9]{9}\d)\b/i.exec(String(objectName ?? ''));
    return m ? m[1].toUpperCase() : '';
};

// ── кэш ──────────────────────────────────────────────────────────────────────

const emptyCache = () => ({ isinToInn: {}, issuers: {} });

const loadCache = async () => {
    try {
        return { ...emptyCache(), ...JSON.parse(await readFile(CACHE_PATH, 'utf8')) };
    } catch {
        return emptyCache();
    }
};

const saveCache = async (cache) => {
    await mkdir(dirname(CACHE_PATH), { recursive: true });
    await writeFile(CACHE_PATH, JSON.stringify(cache, null, 0));
};

const isFresh = (fetchedAt) => {
    if (!fetchedAt) return false;
    return Date.now() - new Date(fetchedAt).getTime() < ISSUER_TTL_DAYS * 864e5;
};

// ── MOEX: ликвидные бумаги (secid + isin) ────────────────────────────────────

/** secid+isin ликвидных бумаг одного борда (у кого в marketdata есть LAST). */
const getLiquidBonds = async (board) => {
    const res = await fetch(
        `${MOEX_BASE}iss/engines/stock/markets/bonds/boards/${board}/securities.json?iss.meta=off`
    );
    if (!res.ok) throw new Error(`board ${board}: HTTP ${res.status}`);
    const json = await res.json();

    const sCols = json.securities.columns;
    const mCols = json.marketdata.columns;
    const secidIdx = colIndex(sCols, 'SECID');
    const isinIdx = colIndex(sCols, 'ISIN');
    const mSecidIdx = colIndex(mCols, 'SECID');
    const lastIdx = colIndex(mCols, 'LAST');

    const priced = new Set();
    for (const row of json.marketdata.data) {
        const last = row[lastIdx];
        if (last !== null && last !== undefined && last !== '') priced.add(row[mSecidIdx]);
    }

    return json.securities.data
        .filter((row) => priced.has(row[secidIdx]))
        .map((row) => ({ secid: row[secidIdx], isin: String(row[isinIdx] ?? '') }))
        .filter((b) => b.isin);
};

// ── ЦБ: сессия + поиск ───────────────────────────────────────────────────────

/**
 * Мини-клиент к AJAX ЦБ. Хранит cookie-сессию и CSRF-токен; на «invalid_csrf»
 * подхватывает свежий токен из ошибки и повторяет запрос один раз.
 */
class CbrClient {
    constructor() {
        this.cookie = '';
        this.csrf = '';
    }

    async init() {
        // Главная — получить cookie сессии Bitrix; disclaimer=1 добавляем сами.
        const res = await fetch(`${CBR_BASE}/`, { headers: { 'User-Agent': UA } });
        const raw = res.headers.get('set-cookie') ?? '';
        const jar = raw
            .split(/,(?=\s*[A-Za-z0-9_]+=)/)
            .map((c) => c.split(';')[0].trim())
            .filter(Boolean);
        jar.push('disclaimer=1');
        this.cookie = jar.join('; ');
    }

    async search({ isin = '', inn = '' }) {
        // ВАЖНО: Bitrix ждёт литеральные скобки в именах полей (fields[isin]=…).
        // URLSearchParams их percent-энкодит (fields%5Bisin%5D) → бэкенд видит
        // пустой поиск и отвечает ошибкой валидации. Поэтому собираем тело вручную:
        // имена с литеральными скобками, значения — через encodeURIComponent.
        const enc = (v) => encodeURIComponent(String(v));
        const body = [
            'fields[formSearh]=quick',
            'fields[captchaCode]=undefined',
            'fields[dateFrom]=',
            'fields[dateTo]=',
            'fields[ratingName]=',
            `fields[inn]=${enc(inn)}`,
            `fields[isin]=${enc(isin)}`,
            'fields[koNumber]='
        ].join('&');

        const post = () =>
            fetch(CBR_AJAX, {
                method: 'POST',
                headers: {
                    'User-Agent': UA,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    Referer: `${CBR_BASE}/`,
                    Cookie: this.cookie,
                    ...(this.csrf ? { 'X-Bitrix-Csrf-Token': this.csrf } : {})
                },
                body
            }).then((r) => r.json());

        let json = await post();
        if (json?.status === 'error' && json?.errors?.[0]?.customData?.csrf) {
            this.csrf = json.errors[0].customData.csrf;
            json = await post();
        }
        if (json?.status !== 'success') {
            const msg = json?.errors?.[0]?.message ?? 'unknown';
            throw new Error(`CBR search failed (${msg})`);
        }
        return json.data?.itemList ?? [];
    }
}

// ── сборка ───────────────────────────────────────────────────────────────────

/** Сырой item ЦБ → наш IBondRatingAction. */
const toAction = (item) => {
    const code = actionCode(item.ratingAction);
    return {
        agency: shortAgency(item.kraName),
        value: String(item.ratingValue ?? '').trim(),
        outlook: cleanOutlook(item.prediction),
        action: ACTION_LABELS[code] ?? String(item.ratingAction ?? '').split(/\s*[–-]\s*/)[1] ?? '',
        actionCode: code,
        date: toIso(item.releaseDate),
        url: String(item.releaseUrl ?? ''),
        withdrawn: code === 'WD' || /отозван/i.test(String(item.ratingValue ?? ''))
    };
};

const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

/** Последнее действие по каждому агентству (актуальный рейтинг). */
const latestPerAgency = (actions) => {
    const byAgency = new Map();
    for (const a of actions) {
        const prev = byAgency.get(a.agency);
        if (!prev || a.date > prev.date) byAgency.set(a.agency, a);
    }
    return [...byAgency.values()].sort((x, y) => x.agency.localeCompare(y.agency, 'ru'));
};

/** Убрать служебное поле _isin перед записью в выходной файл. */
const strip = ({ _isin, ...rest }) => rest;

/**
 * Рейтинги конкретной бумаги (фактически — её эмитента).
 * current — актуальный рейтинг эмитента: последнее НЕ отозванное действие каждого
 *   агентства. Берём по эмитенту (а не строго по ISIN), т.к. часть действий ЦБ
 *   привязывает к эмитенту без ISIN — иначе агентство терялось бы из current.
 * history — лента рейтинговых событий эмитента (по всем выпускам). ЦБ отдаёт по
 *   каждому выпуску лишь последнее действие, поэтому одиночная история выпуска
 *   неинформативна; берём события эмитента и схлопываем дубли (одно и то же
 *   действие по нескольким выпускам в один день) — получается динамика рейтинга.
 */
const resolveForBond = (issuerActions) => {
    const activeIssuer = issuerActions.filter((a) => !a.withdrawn);
    const current = latestPerAgency(activeIssuer.length ? activeIssuer : issuerActions).map(strip);

    const seen = new Set();
    const history = [...issuerActions]
        .sort(byDateDesc)
        .filter((a) => {
            const key = `${a.agency}|${a.date}|${a.actionCode}|${a.value}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 12)
        .map(strip);

    return { current, history };
};

const main = async () => {
    const started = Date.now();
    const cache = await loadCache();
    let liveCalls = 0;

    let bonds = [];
    try {
        bonds = (await Promise.all(BOND_BOARDS.map(getLiquidBonds))).flat();
    } catch (err) {
        console.warn(`[ratings] MOEX недоступен (${err?.message ?? err}); прерываю, кэш не трогаю`);
        return;
    }
    // Уникальные ISIN (одна бумага может прийти с обоих бордов — не должна, но на всякий).
    const byIsin = new Map(bonds.map((b) => [b.isin, b]));
    const uniqueBonds = [...byIsin.values()];
    console.log(`[ratings] ликвидных бумаг: ${uniqueBonds.length}`);

    const cbr = new CbrClient();
    try {
        await cbr.init();
    } catch (err) {
        console.warn(`[ratings] не удалось открыть сессию ЦБ (${err?.message ?? err})`);
        return;
    }

    // Шаг 1 — узнать ИНН по каждому ещё не проверенному ISIN (кэшируется навсегда).
    // Поиск по ISIN находит бумагу, только если у ВЫПУСКА есть свой рейтинг. Если
    // рейтинга у выпуска нет — ЦБ отвечает ошибкой; помечаем '' («проверено, ИНН не
    // найден напрямую»), но такую бумагу может «подхватить» шаг 2 через ИНН эмитента
    // (по рейтингу другого его выпуска) — см. backfill ниже. `=== undefined` —
    // именно «ещё не проверяли», чтобы не долбить ЦБ теми же ISIN каждый прогон.
    const unknown = uniqueBonds.filter((b) => cache.isinToInn[b.isin] === undefined);
    if (unknown.length) console.log(`[ratings] ИНН неизвестен у ${unknown.length} бумаг, узнаём…`);
    for (const b of unknown) {
        try {
            const items = await cbr.search({ isin: b.isin });
            liveCalls++;
            cache.isinToInn[b.isin] = items.find((it) => it.inn)?.inn ?? '';
        } catch {
            // Чаще всего — у выпуска просто нет собственного рейтинга (ЦБ отдаёт ошибку).
            cache.isinToInn[b.isin] = '';
        }
        if (liveCalls % 50 === 0) await saveCache(cache);
        await sleep(THROTTLE_MS);
    }
    await saveCache(cache);

    // Шаг 2 — рейтинги+история по каждому уникальному ИНН (по TTL).
    const inns = [...new Set(uniqueBonds.map((b) => cache.isinToInn[b.isin]).filter(Boolean))];
    // Перезапрашиваем протухшие ИЛИ без сырья (миграция со старого формата кэша).
    const stale = inns.filter(
        (inn) => !isFresh(cache.issuers[inn]?.fetchedAt) || !cache.issuers[inn]?.items
    );
    console.log(`[ratings] эмитентов: ${inns.length}, обновляем ${stale.length} (остальные свежие)`);
    for (const inn of stale) {
        try {
            const items = await cbr.search({ inn });
            liveCalls++;
            // Храним СЫРЬЁ (только нужные поля) — разбор делаем на шаге 3, чтобы правки
            // презентации применялись пересборкой из кэша без обращений к ЦБ.
            cache.issuers[inn] = {
                fetchedAt: new Date().toISOString(),
                items: items.map((it) => ({
                    kraName: it.kraName,
                    ratingValue: it.ratingValue,
                    prediction: it.prediction,
                    ratingAction: it.ratingAction,
                    releaseDate: it.releaseDate,
                    releaseUrl: it.releaseUrl,
                    objectName: it.objectName
                }))
            };
        } catch (err) {
            console.warn(`[ratings]   ИНН ${inn}: ${err?.message ?? err}`);
        }
        if (liveCalls % 25 === 0) await saveCache(cache);
        await sleep(THROTTLE_MS);
    }

    // Backfill: запрос по ИНН вернул записи по ВСЕМ выпускам эмитента. Проставляем
    // ISIN→ИНН для «соседних» выпусков, чей прямой поиск по ISIN ничего не дал ('') —
    // теперь их рейтинг возьмётся из данных эмитента, и повторно их дёргать не будем.
    for (const [inn, issuer] of Object.entries(cache.issuers)) {
        for (const it of issuer.items ?? []) {
            const isin = isinFromObjectName(it.objectName);
            if (isin && !cache.isinToInn[isin]) cache.isinToInn[isin] = inn;
        }
    }
    await saveCache(cache);

    // Шаг 3 — выход для клиента. Рейтинг у нас эмитентский (одинаков для всех
    // выпусков эмитента), поэтому храним его ОДИН раз по ИНН + карту secid→ИНН —
    // без дублирования по каждой бумаге (иначе файл раздувается в разы).
    const issuersOut = {}; // inn → {current, history}
    const secids = {}; // secid → inn
    for (const b of uniqueBonds) {
        const inn = cache.isinToInn[b.isin];
        const issuer = inn && cache.issuers[inn];
        if (!issuer?.items?.length) continue;
        if (!issuersOut[inn]) {
            const actions = issuer.items.map((it) => ({
                ...toAction(it),
                _isin: isinFromObjectName(it.objectName)
            }));
            const resolved = resolveForBond(actions);
            if (!resolved.current.length) continue;
            issuersOut[inn] = resolved;
        }
        secids[b.secid] = inn;
    }
    await mkdir(dirname(OUT_PATH), { recursive: true });
    await writeFile(OUT_PATH, JSON.stringify({ issuers: issuersOut, secids }));

    console.log(
        `[ratings] готово: ${Object.keys(secids).length} бумаг (${Object.keys(issuersOut).length} эмитентов) с рейтингом, ${liveCalls} живых запросов к ЦБ за ${(
            (Date.now() - started) /
            1000
        ).toFixed(0)}с → public/bond-ratings.json`
    );
};

main().catch((err) => {
    console.warn(`[ratings] неожиданная ошибка (${err?.message ?? err}); выходим без падения`);
});
