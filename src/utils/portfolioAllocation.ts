import { IPosition } from '@models/tinkoffData';
import { BondRatingsData, BondSectorInfo } from '@models/bond';
import { BOND_SECTOR_OTHER, sectorByShortName } from '@api/moex/bonds/bondSectors';
import { categorizeFund, FUND_CATEGORY_LABEL } from '@api/moex/funds/fundCategory';
import { instrumentTypeLabel } from './instrumentType';
import { ratingTier } from './bondLabels';
import { AllocationSlice, PortfolioScope } from './portfolioScope';

/** Режим разбивки пончика: классы / сектора / валюта / кредитный рейтинг / отдельные бумаги. */
export type AllocationMode = 'type' | 'sector' | 'currency' | 'rating' | 'asset';

/** Обобщённый срез пончика — с готовыми меткой и цветом (в отличие от AllocationSlice). */
export interface AllocSlice {
    key: string;
    label: string;
    value: number;
    color: string;
}

/** Фиксированные цвета по типу инструмента (режим «Классы»). */
const TYPE_COLOR: Record<string, string> = {
    share: '#2a78d6',
    bond: '#1baf7a',
    etf: '#7f77dd',
    currency: '#eda100',
    futures: '#eb6834',
    crypto: '#f7931a'
};

/** Категориальная палитра для секторов/бумаг (цвет по позиции в отсортированном списке). */
const CATEGORICAL = [
    '#2a78d6', '#1baf7a', '#7f77dd', '#eda100', '#eb6834',
    '#4aa3df', '#33b985', '#c65fb0', '#e0655f', '#5b8def',
    '#d99a1c', '#3fb0a0'
];
const MUTED = '#8a8f99';
const OTHER_LABEL = 'Прочее';
const CASH_LABEL = 'Валюта';
const CRYPTO_LABEL = 'Криптовалюта';
/** Человекочитаемые названия валют по коду Т-Банка (нижний регистр). */
const CURRENCY_LABEL: Record<string, string> = {
    rub: 'Рубль ₽',
    usd: 'Доллар $',
    eur: 'Евро €',
    cny: 'Юань ¥',
    hkd: 'Гонконгский доллар',
    gbp: 'Фунт £',
    chf: 'Франк',
    jpy: 'Иена ¥',
    try: 'Лира',
    kzt: 'Тенге'
};
const currencyLabel = (code: string) => CURRENCY_LABEL[code] ?? code.toUpperCase();

// Кредитный рейтинг: буквенные тиры ЦБ + суверен/квазигос + не-облигационные
// корзины. Порядок — по убыванию надёжности (для градиента в пончике/легенде).
const RATING_OFZ = 'ОФЗ';
const RATING_MUNI = 'Муниципальные';
const RATING_NONE = 'Без рейтинга';
const RATING_NONBOND = 'Акции и фонды';
/** Метка корзины рейтинга по тиру буквенной шкалы (ratingTier). */
const RATING_TIER_LABEL: Record<string, string> = {
    high: 'AA–AAA',
    good: 'A',
    moderate: 'BBB',
    speculative: 'BB и ниже'
};
/** Фиксированные цвет и порядок корзин рейтинга (зелёный→красный, прочее — нейтральное). */
const RATING_STYLE: { label: string; color: string }[] = [
    { label: RATING_OFZ, color: '#1baf7a' },
    { label: RATING_MUNI, color: '#33b985' },
    { label: 'AA–AAA', color: '#2a78d6' },
    { label: 'A', color: '#4aa3df' },
    { label: 'BBB', color: '#eda100' },
    { label: 'BB и ниже', color: '#e24b4a' },
    { label: RATING_NONE, color: MUTED },
    { label: RATING_NONBOND, color: TYPE_COLOR.etf },
    { label: CRYPTO_LABEL, color: TYPE_COLOR.crypto },
    { label: CASH_LABEL, color: TYPE_COLOR.currency }
];
const RATING_ORDER = RATING_STYLE.map((entry) => entry.label);
const RATING_COLOR = Object.fromEntries(RATING_STYLE.map((entry) => [entry.label, entry.color]));
/** Метки срезов для гос/муни облигаций (отрасль к ним неприменима). */
const OFZ_LABEL = 'ОФЗ';
const MUNI_LABEL = 'Муниципальные';

const round2 = (n: number) => Number(n.toFixed(2));

/** Цвет для среза-исключения (Прочее/Валюта), иначе категориальный по индексу. */
const sliceColor = (label: string, index: number): string => {
    if (label === OTHER_LABEL) return MUTED;
    if (label === CASH_LABEL) return TYPE_COLOR.currency;
    return CATEGORICAL[index % CATEGORICAL.length];
};

/** «Классы»: из готовых type-срезов scope.allocation, цвета фиксированы по типу. */
const allocationByType = (slices: AllocationSlice[]): AllocSlice[] =>
    slices
        .filter((slice) => slice.value > 0)
        .map((slice) => ({
            key: slice.type,
            label: instrumentTypeLabel(slice.type),
            value: round2(slice.value),
            color: TYPE_COLOR[slice.type] ?? MUTED
        }));

/** «Бумаги»: каждая позиция — отдельный срез (без «Прочего»), кэш — отдельный срез. */
const allocationByAsset = (positions: IPosition[], cash: number): AllocSlice[] => {
    const slices: AllocSlice[] = positions
        .filter((p) => (p.priceInPorfolio ?? 0) > 0)
        .map((p) => ({
            key: p.instrumentUid || p.figi,
            label: p.ticker || p.name || '—',
            value: p.priceInPorfolio ?? 0
        }))
        .sort((a, b) => b.value - a.value)
        .map((item, index) => ({
            key: item.key,
            label: item.label,
            value: round2(item.value),
            color: CATEGORICAL[index % CATEGORICAL.length]
        }));

    if (cash > 0) {
        slices.push({ key: '__cash__', label: CASH_LABEL, value: round2(cash), color: TYPE_COLOR.currency });
    }
    return slices;
};

/**
 * Сектор облигации через джойн с MOEX-справочником по ISIN (запасной ключ — тикер):
 * ОФЗ → «ОФЗ», субфедеральные/муниципальные → «Муниципальные», корпораты → готовый
 * отраслевой сектор. Бумаги нет в справочнике (внебиржа/делистинг) → откат на
 * эвристику по имени (sectorByShortName). Ничего не нашли → «Прочее».
 */
const resolveBondSector = (
    position: IPosition,
    bondSectorMap: Record<string, BondSectorInfo>
): string => {
    const key = (position.isin || position.ticker || '').toUpperCase();
    const info = key ? bondSectorMap[key] : undefined;
    if (info) {
        if (info.issuerType === 'government') return OFZ_LABEL;
        if (info.issuerType === 'municipal') return MUNI_LABEL;
        // Корпорат без известной отрасли: mapBonds ставит sector = BOND_SECTOR_OTHER
        // («Другое») — нормализуем в общий OTHER_LABEL, чтобы не плодить второй
        // ярлык «неизвестно» рядом с «Прочее».
        return info.sector && info.sector !== BOND_SECTOR_OTHER ? info.sector : OTHER_LABEL;
    }
    const resolved = sectorByShortName(position.name ?? position.ticker ?? '');
    return resolved === BOND_SECTOR_OTHER ? OTHER_LABEL : resolved;
};

/**
 * «Сектора» (Вариант 1 — джойн с MOEX-справочниками):
 * акции → карта useSectors по тикеру, облигации → useBondSectorMap по ISIN,
 * фонды → класс актива по названию (categorizeFund). Незнакомые эмитенты и
 * прочие типы → «Прочее»; кэш → «Валюта».
 */
const allocationBySector = (
    positions: IPosition[],
    cash: number,
    shareSectorMap: Record<string, string>,
    bondSectorMap: Record<string, BondSectorInfo>
): AllocSlice[] => {
    const bucket = new Map<string, number>();
    positions.forEach((position) => {
        const value = position.priceInPorfolio ?? 0;
        if (value <= 0) return;

        let sector = OTHER_LABEL;
        if (position.instrumentType === 'crypto') {
            sector = 'Криптовалюта';
        } else if (position.instrumentType === 'bond') {
            sector = resolveBondSector(position, bondSectorMap);
        } else if (position.instrumentType === 'etf') {
            // У фондов нет отраслевого сектора — классифицируем по классу актива
            // (денежный рынок / облигации / акции / золото / смешанный) той же
            // эвристикой по названию, что и страница «Фонды».
            sector = FUND_CATEGORY_LABEL[categorizeFund(position.name ?? position.ticker ?? '')];
        } else if (position.instrumentType === 'share') {
            sector = (position.ticker && shareSectorMap[position.ticker]) || OTHER_LABEL;
        }
        bucket.set(sector, (bucket.get(sector) ?? 0) + value);
    });
    if (cash > 0) bucket.set(CASH_LABEL, (bucket.get(CASH_LABEL) ?? 0) + cash);

    return Array.from(bucket.entries())
        .map(([label, value]) => ({ label, value: round2(value) }))
        .sort((a, b) => b.value - a.value)
        .map((entry, index) => ({
            key: entry.label,
            label: entry.label,
            value: entry.value,
            color: sliceColor(entry.label, index)
        }));
};

/**
 * «Валюта» — валютная структура АКТИВОВ: срезы по валюте номинала бумаги
 * (position.currency, коды Т-Банка в нижнем регистре). Крипта (Trezor) — своим
 * срезом, а не по расчётной валюте. Стоимости позиций Т-Банк отдаёт в рублях
 * (priceInPorfolio), поэтому суммируем рублёвые величины по группам валют —
 * получается доля портфеля в бумагах каждой валюты. Денежный остаток (cash) —
 * агрегат в рублях, кладём в рубль (посчитать его валютный состав из scope нельзя).
 */
const allocationByCurrency = (positions: IPosition[], cash: number): AllocSlice[] => {
    const bucket = new Map<string, number>();
    const add = (code: string, value: number) => bucket.set(code, (bucket.get(code) ?? 0) + value);

    positions.forEach((position) => {
        const value = position.priceInPorfolio ?? 0;
        if (value <= 0) return;
        if (position.instrumentType === 'crypto') {
            add('__crypto__', value);
            return;
        }
        add((position.currency || 'rub').toLowerCase(), value);
    });
    if (cash > 0) add('rub', cash);

    return Array.from(bucket.entries())
        .map(([code, value]) => ({ code, value: round2(value) }))
        .sort((a, b) => b.value - a.value)
        .map((entry, index) => ({
            key: entry.code,
            label: entry.code === '__crypto__' ? CRYPTO_LABEL : currencyLabel(entry.code),
            value: entry.value,
            color: entry.code === '__crypto__' ? TYPE_COLOR.crypto : CATEGORICAL[index % CATEGORICAL.length]
        }));
};

/**
 * Корзина кредитного рейтинга одной облигации: сначала класс эмитента (ОФЗ/муни —
 * у них нет агентского рейтинга ЦБ, но это высшее качество), затем джойн
 * position→secid→ИНН→рейтинг (та же карта, что на странице бумаги) и буквенный
 * тир. Корпорат без найденного рейтинга → «Без рейтинга».
 */
const resolveBondRating = (
    position: IPosition,
    bondSectorMap: Record<string, BondSectorInfo>,
    bondRatings?: BondRatingsData
): string => {
    const key = (position.isin || position.ticker || '').toUpperCase();
    const issuerType = key ? bondSectorMap[key]?.issuerType : undefined;
    if (issuerType === 'government') return RATING_OFZ;
    if (issuerType === 'municipal') return RATING_MUNI;

    if (!bondRatings) return RATING_NONE;
    // secid карты рейтингов = ISIN бумаги (запасной ключ — тикер).
    const inn = bondRatings.secids[key] ?? bondRatings.secids[(position.ticker || '').toUpperCase()];
    const action = inn ? bondRatings.issuers[inn]?.current.find((a) => !a.withdrawn) : undefined;
    if (!action) return RATING_NONE;
    return RATING_TIER_LABEL[ratingTier(action)] ?? RATING_NONE;
};

/**
 * «Рейтинг» — кредитное качество портфеля. Облигации разложены по буквенным тирам
 * ЦБ (+ ОФЗ/муни отдельными корзинами высшего качества), не-облигации собраны в
 * «Акции и фонды», крипта и кэш — своими срезами. Так пончик по-прежнему = 100%
 * портфеля, а порядок корзин отражает убывание надёжности.
 */
const allocationByRating = (
    positions: IPosition[],
    cash: number,
    bondSectorMap: Record<string, BondSectorInfo>,
    bondRatings?: BondRatingsData
): AllocSlice[] => {
    const bucket = new Map<string, number>();
    const add = (label: string, value: number) => bucket.set(label, (bucket.get(label) ?? 0) + value);

    positions.forEach((position) => {
        const value = position.priceInPorfolio ?? 0;
        if (value <= 0) return;
        if (position.instrumentType === 'bond') {
            add(resolveBondRating(position, bondSectorMap, bondRatings), value);
        } else if (position.instrumentType === 'crypto') {
            add(CRYPTO_LABEL, value);
        } else {
            add(RATING_NONBOND, value);
        }
    });
    if (cash > 0) add(CASH_LABEL, cash);

    return Array.from(bucket.entries())
        .map(([label, value]) => ({ label, value: round2(value) }))
        .sort((a, b) => RATING_ORDER.indexOf(a.label) - RATING_ORDER.indexOf(b.label))
        .map((entry) => ({
            key: entry.label,
            label: entry.label,
            value: entry.value,
            color: RATING_COLOR[entry.label] ?? MUTED
        }));
};

/** Единая точка входа: срезы пончика для выбранного режима. */
export const buildAllocation = (
    mode: AllocationMode,
    scope: PortfolioScope,
    shareSectorMap: Record<string, string>,
    bondSectorMap: Record<string, BondSectorInfo>,
    bondRatings?: BondRatingsData
): AllocSlice[] => {
    if (mode === 'asset') return allocationByAsset(scope.positions, scope.cash);
    if (mode === 'currency') return allocationByCurrency(scope.positions, scope.cash);
    if (mode === 'rating') return allocationByRating(scope.positions, scope.cash, bondSectorMap, bondRatings);
    if (mode === 'sector')
        return allocationBySector(scope.positions, scope.cash, shareSectorMap, bondSectorMap);
    return allocationByType(scope.allocation);
};
