import { IShareDetail } from '@models/shareDetail';
import { columnGetter, toNumber, toNumberOrNull } from '../columnUtils';
import { IShareDetailRaw } from './getShareDetail';

const isTrue = (value: unknown): boolean => value === 1 || value === '1' || value === true;

/**
 * Собирает плоскую типизированную акцию из маркетдаты TQBR и карточки бумаги.
 * Возвращает null, если бумага не торгуется на TQBR (нет строки маркетдаты).
 */
export const mapShareDetail = ({ board, card }: IShareDetailRaw): IShareDetail | null => {
    if (!board.securities?.data?.length) return null;

    const sec = columnGetter(board.securities.columns);
    const mkt = columnGetter(board.marketdata.columns);
    const s = board.securities.data[0] ?? [];
    const m = board.marketdata.data[0] ?? [];

    const price = toNumberOrNull(mkt(m, 'LAST'));
    const prevPrice = toNumberOrNull(sec(s, 'PREVPRICE'));
    const bid = toNumberOrNull(mkt(m, 'BID'));
    const offer = toNumberOrNull(mkt(m, 'OFFER'));

    const typeName = String(card.TYPENAME ?? sec(s, 'SECNAME') ?? '');
    const type = String(card.TYPE ?? '');
    const isPreferred = type === 'preferred_share' || /привилег/i.test(typeName);

    return {
        ticker: sec<string>(s, 'SECID'),
        shortName: String(card.SHORTNAME ?? sec(s, 'SHORTNAME') ?? sec(s, 'SECID')),
        fullName: String(card.NAME ?? sec(s, 'SECNAME') ?? ''),
        latName: String(card.LATNAME ?? sec(s, 'LATNAME') ?? ''),
        isin: String(card.ISIN ?? sec(s, 'ISIN') ?? ''),
        regNumber: String(card.REGNUMBER ?? sec(s, 'REGNUMBER') ?? ''),
        typeName,
        isPreferred,

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

        volumeToday: toNumberOrNull(mkt(m, 'VOLTODAY')),
        valueToday: toNumberOrNull(mkt(m, 'VALTODAY')),
        numTrades: toNumberOrNull(mkt(m, 'NUMTRADES')),
        updateTime: String(mkt(m, 'UPDATETIME') ?? ''),

        capitalization: toNumberOrNull(mkt(m, 'ISSUECAPITALIZATION')),
        issueSize: toNumberOrNull(card.ISSUESIZE ?? sec(s, 'ISSUESIZE')),
        faceValue: toNumberOrNull(card.FACEVALUE ?? sec(s, 'FACEVALUE')),
        faceUnit: String(card.FACEUNIT ?? sec(s, 'FACEUNIT') ?? 'SUR'),
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
