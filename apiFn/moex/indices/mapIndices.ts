import { IIndex, IIndicesRaw, IndexReturnType } from '@models/marketIndex';
import { columnGetter, toNumber, toNumberOrNull } from '../columnUtils';
import { deriveIndexGroup } from './indexGroup';

/**
 * Тип расчёта из CALCMODE: 'PR' — ценовой, 'TR'/'TRB'/'TRN' — полной доходности
 * (брутто/нетто). Всё, что начинается на TR, считаем полной доходностью; остальное —
 * ценовым (безопасный дефолт, чтобы индекс не пропал из списка).
 */
const deriveReturnType = (calcMode: string): IndexReturnType =>
    String(calcMode ?? '')
        .toUpperCase()
        .startsWith('TR')
        ? 'total'
        : 'price';

/**
 * Преобразует сырой ответ борда SNDX в плоский список индексов. Джойн
 * securities × marketdata идёт через Map по SECID — O(n). Текущее значение берём из
 * CURRENTVALUE, а вне торговой сессии (пусто) — из LASTVALUE.
 */
export const mapIndices = (raw: IIndicesRaw): IIndex[] => {
    const sec = columnGetter(raw.securities.columns);
    const mkt = columnGetter(raw.marketdata.columns);

    const marketBySecid = new Map<string, unknown[]>(
        raw.marketdata.data.map((row) => [mkt<string>(row, 'SECID'), row])
    );

    return raw.securities.data.map((row): IIndex => {
        const secid = sec<string>(row, 'SECID');
        const market = marketBySecid.get(secid) ?? [];
        const name = sec<string>(row, 'NAME') ?? sec<string>(row, 'SHORTNAME') ?? secid;

        return {
            id: secid,
            secid,
            shortName: sec<string>(row, 'SHORTNAME') ?? secid,
            name,

            group: deriveIndexGroup(secid, name),
            returnType: deriveReturnType(sec<string>(row, 'CALCMODE')),

            value:
                toNumberOrNull(mkt(market, 'CURRENTVALUE')) ??
                toNumberOrNull(mkt(market, 'LASTVALUE')),
            dayChangePercent: toNumber(mkt(market, 'LASTCHANGEPRC')),
            monthChangePercent: toNumber(mkt(market, 'MONTHCHANGEPRC')),
            yearChangePercent: toNumber(mkt(market, 'YEARCHANGEPRC')),

            valToday: toNumber(mkt(market, 'VALTODAY')),
            capitalization: toNumber(mkt(market, 'CAPITALIZATION')),
            annualHigh: toNumberOrNull(sec(row, 'ANNUALHIGH')),
            annualLow: toNumberOrNull(sec(row, 'ANNUALLOW')),
            decimals: toNumber(sec(row, 'DECIMALS')) || 2,
            currency: sec<string>(row, 'CURRENCYID') ?? 'RUB'
        };
    });
};
