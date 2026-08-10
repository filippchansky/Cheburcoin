import { IPosition } from '@models/tinkoffData';
import { BOND_SECTOR_OTHER, sectorByShortName } from '@api/moex/bonds/bondSectors';
import { instrumentTypeLabel } from './instrumentType';
import { AllocationSlice, PortfolioScope } from './portfolioScope';

/** Режим разбивки пончика: классы инструментов / сектора / отдельные бумаги. */
export type AllocationMode = 'type' | 'sector' | 'asset';

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
    futures: '#eb6834'
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
/** Максимум именованных срезов в режиме «Бумаги»; остальное — «Прочее». */
const ASSET_MAX_SLICES = 8;

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

/** «Бумаги»: топ-N позиций по стоимости, хвост схлопывается в «Прочее», кэш — отдельный срез. */
const allocationByAsset = (positions: IPosition[], cash: number): AllocSlice[] => {
    const sorted = positions
        .filter((p) => (p.priceInPorfolio ?? 0) > 0)
        .map((p) => ({
            key: p.instrumentUid || p.figi,
            label: p.ticker || p.name || '—',
            value: p.priceInPorfolio ?? 0
        }))
        .sort((a, b) => b.value - a.value);

    const head = sorted.slice(0, ASSET_MAX_SLICES);
    const tailSum = sorted.slice(ASSET_MAX_SLICES).reduce((sum, item) => sum + item.value, 0);

    const slices: AllocSlice[] = head.map((item, index) => ({
        key: item.key,
        label: item.label,
        value: round2(item.value),
        color: CATEGORICAL[index % CATEGORICAL.length]
    }));
    if (tailSum > 0) {
        slices.push({ key: '__other__', label: OTHER_LABEL, value: round2(tailSum), color: MUTED });
    }
    if (cash > 0) {
        slices.push({ key: '__cash__', label: CASH_LABEL, value: round2(cash), color: TYPE_COLOR.currency });
    }
    return slices;
};

/**
 * «Сектора» (Вариант 1 — джойн с MOEX-справочниками):
 * акции/фонды → карта useSectors по тикеру, облигации → sectorByShortName по имени.
 * Незнакомые эмитенты и прочие типы → «Прочее»; кэш → «Валюта».
 */
const allocationBySector = (
    positions: IPosition[],
    cash: number,
    shareSectorMap: Record<string, string>
): AllocSlice[] => {
    const bucket = new Map<string, number>();
    positions.forEach((position) => {
        const value = position.priceInPorfolio ?? 0;
        if (value <= 0) return;

        let sector = OTHER_LABEL;
        if (position.instrumentType === 'bond') {
            const resolved = sectorByShortName(position.name ?? position.ticker ?? '');
            sector = resolved === BOND_SECTOR_OTHER ? OTHER_LABEL : resolved;
        } else if (position.instrumentType === 'share' || position.instrumentType === 'etf') {
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

/** Единая точка входа: срезы пончика для выбранного режима. */
export const buildAllocation = (
    mode: AllocationMode,
    scope: PortfolioScope,
    shareSectorMap: Record<string, string>
): AllocSlice[] => {
    if (mode === 'asset') return allocationByAsset(scope.positions, scope.cash);
    if (mode === 'sector') return allocationBySector(scope.positions, scope.cash, shareSectorMap);
    return allocationByType(scope.allocation);
};
