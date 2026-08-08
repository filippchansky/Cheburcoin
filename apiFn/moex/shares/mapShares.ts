import { IShares } from '@models/allSharesData';
import { IFilteredShares } from '@models/filteredShares';
import { columnGetter, toNumber } from '../columnUtils';

/**
 * Преобразует сырой ответ MOEX в плоский типизированный список бумаг.
 * Джойн securities × marketdata идёт через Map по тикеру — O(n).
 * Оставляем только бумаги с положительной капитализацией, сортируем по ней убыв.
 */
export const mapShares = (raw: IShares): IFilteredShares[] => {
    const sec = columnGetter(raw.securities.columns);
    const mkt = columnGetter(raw.marketdata.columns);

    const securityByTicker = new Map<string, unknown[]>(
        raw.securities.data.map((row) => [sec<string>(row, 'SECID'), row])
    );

    return raw.marketdata.data
        .map((row): IFilteredShares => {
            const ticker = mkt<string>(row, 'SECID');
            const security = securityByTicker.get(ticker) ?? [];

            const price = toNumber(mkt(row, 'LAST'));
            const prevPrice = toNumber(sec(security, 'PREVPRICE'));

            return {
                id: ticker,
                ticker,
                title: sec<string>(security, 'SHORTNAME') ?? ticker,
                icon: sec<string>(security, 'ISIN') ?? '',
                price,
                openPrice: toNumber(mkt(row, 'OPEN')),
                lowPrice: toNumber(mkt(row, 'LOW')),
                highPrice: toNumber(mkt(row, 'HIGH')),
                prevPrice,
                capitalization: toNumber(mkt(row, 'ISSUECAPITALIZATION')),
                valToday: toNumber(mkt(row, 'VALTODAY')),
                dayChange: price && prevPrice ? price - prevPrice : 0,
                dayChangePercent: toNumber(mkt(row, 'LASTTOPREVPRICE'))
            };
        })
        .filter((share) => share.capitalization > 0)
        .sort((a, b) => b.capitalization - a.capitalization);
};
