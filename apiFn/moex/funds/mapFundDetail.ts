import { IFundDetail } from '@models/fundDetail';
import { columnGetter, toNumber, toNumberOrNull } from '../columnUtils';
import { IFundDetailRaw } from './getFundDetail';
import { categorizeFund } from './fundCategory';

const isTrue = (value: unknown): boolean => value === 1 || value === '1' || value === true;

/**
 * Собирает плоский типизированный фонд из маркетдаты TQBR и карточки бумаги.
 * Возвращает null, если бумага не торгуется на TQBR (нет строки маркетдаты).
 * Категория выводится из полного имени (в бесплатном ISS готовой классификации нет).
 */
export const mapFundDetail = ({ board, card }: IFundDetailRaw): IFundDetail | null => {
    if (!board.securities?.data?.length) return null;

    const sec = columnGetter(board.securities.columns);
    const mkt = columnGetter(board.marketdata.columns);
    const s = board.securities.data[0] ?? [];
    const m = board.marketdata.data[0] ?? [];

    const price = toNumberOrNull(mkt(m, 'LAST'));
    const prevPrice = toNumberOrNull(sec(s, 'PREVPRICE'));
    const bid = toNumberOrNull(mkt(m, 'BID'));
    const offer = toNumberOrNull(mkt(m, 'OFFER'));

    const fullName = String(card.NAME ?? sec(s, 'SECNAME') ?? '');

    return {
        ticker: sec<string>(s, 'SECID'),
        shortName: String(card.SHORTNAME ?? sec(s, 'SHORTNAME') ?? sec(s, 'SECID')),
        fullName,
        isin: String(card.ISIN ?? sec(s, 'ISIN') ?? ''),
        regNumber: String(card.REGNUMBER ?? sec(s, 'REGNUMBER') ?? ''),
        typeName: String(card.TYPENAME ?? 'Пай биржевого ПИФа'),
        category: categorizeFund(fullName),

        price,
        prevPrice,
        open: toNumberOrNull(mkt(m, 'OPEN')),
        dayLow: toNumberOrNull(mkt(m, 'LOW')),
        dayHigh: toNumberOrNull(mkt(m, 'HIGH')),
        dayChange: price !== null && prevPrice !== null ? price - prevPrice : 0,
        dayChangePercent: toNumber(mkt(m, 'LASTTOPREVPRICE')),
        bid,
        offer,
        spread: bid !== null && offer !== null ? offer - bid : null,
        waPrice: toNumberOrNull(mkt(m, 'WAPRICE')),

        valueToday: toNumberOrNull(mkt(m, 'VALTODAY')),
        volumeToday: toNumberOrNull(mkt(m, 'VOLTODAY')),
        numTrades: toNumberOrNull(mkt(m, 'NUMTRADES')),
        updateTime: String(mkt(m, 'UPDATETIME') ?? ''),

        currency: String(sec(s, 'CURRENCYID') ?? 'SUR'),
        lotSize: toNumberOrNull(sec(s, 'LOTSIZE')),
        listLevel: toNumberOrNull(card.LISTLEVEL ?? sec(s, 'LISTLEVEL')),
        forQualified: isTrue(card.ISQUALIFIEDINVESTORS),
        issueDate: String(card.ISSUEDATE ?? ''),

        morningSession: isTrue(card.MORNINGSESSION),
        eveningSession: isTrue(card.EVENINGSESSION),
        weekendSession: isTrue(card.WEEKENDSESSION)
    };
};
