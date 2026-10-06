import { IFuture, IFuturesRaw } from '@models/marketFuture';
import { columnGetter, toNumber, toNumberOrNull } from '../columnUtils';
import { deriveFutureGroup } from './futureGroup';

/**
 * Вечные (бессрочные) фьючерсы у MOEX не имеют месячного суффикса в имени
 * (USDRUBF, SBERF, SP500F), тогда как серийные — «BR-10.26», «Si-3.27». Отсюда и
 * детект: имя БЕЗ хвоста «-M.YY» — вечный контракт.
 */
const MONTH_SUFFIX = /-\d{1,2}\.\d{2}$/;

/**
 * Преобразует сырой ответ борда FORTS в плоский список фьючерсов. Джойн
 * securities × marketdata идёт через Map по SECID — O(n). Текущую цену берём из LAST,
 * а вне торговой сессии (пусто) — из последней расчётной LASTSETTLEPRICE.
 */
export const mapFutures = (raw: IFuturesRaw): IFuture[] => {
    const sec = columnGetter(raw.securities.columns);
    const mkt = columnGetter(raw.marketdata.columns);

    const marketBySecid = new Map<string, unknown[]>(
        raw.marketdata.data.map((row) => [mkt<string>(row, 'SECID'), row])
    );

    return raw.securities.data.map((row): IFuture => {
        const secid = sec<string>(row, 'SECID');
        const market = marketBySecid.get(secid) ?? [];
        const shortName = sec<string>(row, 'SHORTNAME') ?? secid;

        return {
            id: secid,
            secid,
            shortName,
            name: sec<string>(row, 'SECNAME') ?? shortName,
            assetCode: sec<string>(row, 'ASSETCODE') ?? secid,

            group: deriveFutureGroup(sec<string>(row, 'ASSETCODE')),
            isPerpetual: !MONTH_SUFFIX.test(shortName),

            last:
                toNumberOrNull(mkt(market, 'LAST')) ??
                toNumberOrNull(sec(row, 'LASTSETTLEPRICE')),
            dayChangePercent: toNumber(mkt(market, 'LASTTOPREVPRICE')),
            openPosition: toNumber(mkt(market, 'OPENPOSITION')),
            volToday: toNumber(mkt(market, 'VOLTODAY')),
            valToday: toNumber(mkt(market, 'VALTODAY')),
            numTrades: toNumber(mkt(market, 'NUMTRADES')),

            expiry: sec<string>(row, 'LASTTRADEDATE') ?? '',
            lot: toNumber(sec(row, 'LOTVOLUME')) || 1,
            minStep: toNumber(sec(row, 'MINSTEP')),
            stepPrice: toNumber(sec(row, 'STEPPRICE')),
            initialMargin: toNumber(sec(row, 'INITIALMARGIN')),
            decimals: toNumber(sec(row, 'DECIMALS'))
        };
    });
};
