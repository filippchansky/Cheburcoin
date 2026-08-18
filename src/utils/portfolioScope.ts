import { IPortfolio, IPosition } from '@models/tinkoffData';
import { PortfolioAggregate } from '@/hooks/usePortfolio';

export interface AllocationSlice {
    type: string;
    value: number;
}

/** Нормализованный срез портфеля: одинаковая модель для «всех счетов» и для одного счёта. */
export interface PortfolioScope {
    total: number;
    cash: number;
    plAbs: number;
    plPct: number;
    dayAbs: number;
    dayPct: number;
    allocation: AllocationSlice[];
    positions: IPosition[];
}

const TYPE_FIELDS: [keyof IPortfolio, string][] = [
    ['totalAmountShares', 'share'],
    ['totalAmountBonds', 'bond'],
    ['totalAmountEtf', 'etf'],
    ['totalAmountCurrencies', 'currency'],
    ['totalAmountFutures', 'futures'],
    ['totalAmountCrypto', 'crypto']
];

const buildAllocation = (source: Record<string, number>): AllocationSlice[] =>
    Object.entries(source)
        .map(([type, value]) => ({ type, value: Number(value) || 0 }))
        .filter((slice) => slice.value > 0)
        .sort((a, b) => b.value - a.value);

/** Процент от «тела» (стоимость без учёта самой прибыли). */
const relative = (part: number, total: number) => {
    const base = total - part;
    return base > 0 ? Number(((part / base) * 100).toFixed(2)) : 0;
};

/**
 * «Разница цены активов» (переоценка открытых позиций) как сумма по бумагам
 * (текущая цена − средняя цена покупки) × количество. Считаем сами, а не берём
 * бэковский `expectedYieldInt` — он равен «средний % доходности портфеля ×
 * полная стоимость портфеля (с кэшем)» и систематически ЗАНИЖАЕТ убыток, когда
 * портфель в минусе (умножает процент на меньшую текущую базу вместо стоимости
 * покупки). Валюту/кэш исключаем: это «разница цены АКТИВОВ» (бумаг), а у
 * денежного остатка средней цены покупки в этом смысле нет. Крипту (Trezor) тоже
 * исключаем: кошелёк не знает себестоимость (averagePositionPrice=0), иначе весь
 * баланс монеты фиктивно засчитался бы как прибыль.
 */
const priceGainAbs = (positions: IPosition[]): number =>
    Number(
        positions
            .filter((pos) => pos.instrumentType !== 'currency' && pos.instrumentType !== 'crypto')
            .reduce((sum, pos) => {
                const current = Number(pos.currentPrice) || 0;
                const avg = Number(pos.averagePositionPrice) || 0;
                const qty = Number(pos.quantity) || 0;
                return sum + (current - avg) * qty;
            }, 0)
            .toFixed(2)
    );

/** Срез по одному счёту. */
export const scopeFromPortfolio = (p: IPortfolio): PortfolioScope => {
    const byType: Record<string, number> = {};
    TYPE_FIELDS.forEach(([field, type]) => {
        byType[type] = Number(p[field]) || 0;
    });
    const plAbs = priceGainAbs(p.positions ?? []);
    return {
        total: p.totalAmountPortfolio ?? 0,
        cash: p.totalAmountCurrencies ?? 0,
        plAbs,
        plPct: relative(plAbs, p.totalAmountPortfolio ?? 0),
        dayAbs: p.dailyYield ?? 0,
        dayPct: p.dailyYieldRelative ?? 0,
        allocation: buildAllocation(byType),
        positions: (p.positions ?? []).filter((item) => item.ticker)
    };
};

/** Срез по всем счетам (из агрегата usePortfolio). Проценты считаем сами — в агрегате их нет. */
export const scopeFromAggregate = (agg: PortfolioAggregate): PortfolioScope => {
    const plAbs = priceGainAbs(agg.positions);
    return {
        total: agg.totalAmountPortfolio,
        cash: agg.byType.currency ?? 0,
        plAbs,
        plPct: relative(plAbs, agg.totalAmountPortfolio),
        dayAbs: agg.dailyYieldInt,
        dayPct: relative(agg.dailyYieldInt, agg.totalAmountPortfolio),
        allocation: buildAllocation(agg.byType),
        positions: agg.positions.filter((item) => item.ticker)
    };
};
