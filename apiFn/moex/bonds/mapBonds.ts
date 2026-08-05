import { CouponType, IBond, IBondsRaw } from '@models/bond';
import { columnGetter, toNumber, toNumberOrNull } from '../columnUtils';

/** Код типа ОФЗ из SECNAME («ОФЗ-ПД …» → «ПД»). */
const parseTypeCode = (secName: string): string => secName.match(/ОФЗ-([А-Я]+)/)?.[1] ?? '';

/**
 * Тип купона по коду ОФЗ:
 * ПД/ФД — постоянный (fixed), ПК — переменный (floating),
 * ИН — индексируемый номинал (inflation), АД — амортизация (купон фиксированный).
 */
const couponTypeByCode = (code: string): CouponType => {
    if (code === 'ПК') return 'floating';
    if (code === 'ИН') return 'inflation';
    return 'fixed';
};

const hasValue = (value: unknown): boolean =>
    value !== null && value !== undefined && value !== '' && value !== '0000-00-00';

/** Преобразует сырой ответ MOEX по облигациям в плоский типизированный список. */
export const mapBonds = (raw: IBondsRaw): IBond[] => {
    const sec = columnGetter(raw.securities.columns);
    const mkt = columnGetter(raw.marketdata.columns);

    const marketBySecid = new Map<string, unknown[]>(
        raw.marketdata.data.map((row) => [mkt<string>(row, 'SECID'), row])
    );

    return raw.securities.data.map((row): IBond => {
        const secid = sec<string>(row, 'SECID');
        const market = marketBySecid.get(secid) ?? [];

        const name = sec<string>(row, 'SECNAME') ?? '';
        const code = parseTypeCode(name);

        const faceValue = toNumber(sec(row, 'FACEVALUE'));
        const pricePercent = toNumberOrNull(mkt(market, 'LAST'));
        const priceValue = pricePercent === null ? null : (pricePercent / 100) * faceValue;

        const hasOffer =
            hasValue(sec(row, 'OFFERDATE')) ||
            hasValue(sec(row, 'PUTOPTIONDATE')) ||
            hasValue(sec(row, 'CALLOPTIONDATE'));

        return {
            id: secid,
            secid,
            shortName: sec<string>(row, 'SHORTNAME') ?? secid,
            name,

            couponType: couponTypeByCode(code),
            hasAmortization: code === 'АД',
            hasOffer,

            couponPercent: toNumberOrNull(sec(row, 'COUPONPERCENT')),
            couponValue: toNumber(sec(row, 'COUPONVALUE')),
            couponPeriod: toNumber(sec(row, 'COUPONPERIOD')),
            nextCoupon: sec<string>(row, 'NEXTCOUPON') ?? '',
            accruedInt: toNumber(sec(row, 'ACCRUEDINT')),

            faceValue,
            currency: sec<string>(row, 'CURRENCYID') ?? 'SUR',

            pricePercent,
            priceValue,
            yield: toNumberOrNull(mkt(market, 'YIELD')),
            duration: toNumberOrNull(mkt(market, 'DURATION')),

            maturityDate: sec<string>(row, 'MATDATE') ?? '',
            listLevel: toNumber(sec(row, 'LISTLEVEL')),
            isin: sec<string>(row, 'ISIN') ?? ''
        };
    });
};
