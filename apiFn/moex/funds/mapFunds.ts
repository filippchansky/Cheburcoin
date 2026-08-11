import { IFund, IFundsRaw } from '@models/fund';
import { columnGetter, toNumber, toNumberOrNull } from '../columnUtils';
import { categorizeFund } from './fundCategory';

/** Код SECTYPE биржевых фондов (БПИФ/ETF) на TQBR. */
const FUND_SECTYPE = 'J';

/**
 * Преобразует сырой ответ MOEX по TQBR в плоский список биржевых фондов.
 * Отбираем только SECTYPE='J' (БПИФ/ETF) — акции/ДР/небиржевые ПИФ отсекаются.
 * Джойн securities × marketdata идёт через Map по тикеру — O(n).
 */
export const mapFunds = (raw: IFundsRaw): IFund[] => {
    const sec = columnGetter(raw.securities.columns);
    const mkt = columnGetter(raw.marketdata.columns);

    const marketBySecid = new Map<string, unknown[]>(
        raw.marketdata.data.map((row) => [mkt<string>(row, 'SECID'), row])
    );

    return raw.securities.data
        .filter((row) => sec<string>(row, 'SECTYPE') === FUND_SECTYPE)
        .map((row): IFund => {
            const secid = sec<string>(row, 'SECID');
            const market = marketBySecid.get(secid) ?? [];
            const name = sec<string>(row, 'SECNAME') ?? '';

            return {
                id: secid,
                secid,
                ticker: secid,
                shortName: sec<string>(row, 'SHORTNAME') ?? secid,
                name,
                isin: sec<string>(row, 'ISIN') ?? '',

                category: categorizeFund(name),

                price: toNumberOrNull(mkt(market, 'LAST')),
                dayChangePercent: toNumber(mkt(market, 'LASTTOPREVPRICE')),
                valToday: toNumber(mkt(market, 'VALTODAY')),

                listLevel: toNumber(sec(row, 'LISTLEVEL')),
                lotSize: toNumber(sec(row, 'LOTSIZE')),
                currency: sec<string>(row, 'CURRENCYID') ?? 'SUR'
            };
        });
};
