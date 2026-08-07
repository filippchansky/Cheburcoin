import { CouponType, IBond, IBondsRaw, IssuerType } from '@models/bond';
import { columnGetter, toNumber, toNumberOrNull } from '../columnUtils';
import { sectorByShortName } from './bondSectors';

/**
 * Класс эмитента по коду SECTYPE MOEX: «3» — федеральные гособлигации (ОФЗ),
 * «4» — субфедеральные/муниципальные, прочее («6»/«8»/«C»…) — корпоративные.
 */
const issuerTypeBySecType = (code: string): IssuerType => {
    if (code === '3') return 'government';
    if (code === '4') return 'municipal';
    return 'corporate';
};

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

/**
 * Тип купона бумаги. Приоритет — «Вид облигации» (BONDTYPE) от биржи, который
 * заполнен для всего рынка и однозначен там, где касается природы купона:
 * «Флоатер» → floating, «Линкер…» → inflation, «Дисконтная» → discount, «Фикс …» → fixed.
 * Для видов, не говорящих о купоне (Структурная/Амортизируемые/Валютные/Конвертируемые
 * или пусто), откатываемся на код ОФЗ из SECNAME, а затем на ставку купона.
 */
const deriveCouponType = (
    bondType: string,
    secName: string,
    couponPercent: number | null
): CouponType => {
    if (bondType === 'Флоатер') return 'floating';
    if (bondType.startsWith('Линкер')) return 'inflation';
    if (bondType.startsWith('Дисконт')) return 'discount';
    if (bondType.startsWith('Фикс')) return 'fixed';

    const code = parseTypeCode(secName);
    if (code) return couponTypeByCode(code);
    return couponPercent && couponPercent > 0 ? 'fixed' : 'floating';
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
        const shortName = sec<string>(row, 'SHORTNAME') ?? secid;
        const code = parseTypeCode(name);
        const bondType = sec<string>(row, 'BONDTYPE') ?? '';
        const secType = sec<string>(row, 'SECTYPE') ?? '';
        const issuerType = issuerTypeBySecType(secType);
        const couponPercent = toNumberOrNull(sec(row, 'COUPONPERCENT'));

        const faceValue = toNumber(sec(row, 'FACEVALUE'));
        const pricePercent = toNumberOrNull(mkt(market, 'LAST'));
        const priceValue = pricePercent === null ? null : (pricePercent / 100) * faceValue;

        const couponValue = toNumber(sec(row, 'COUPONVALUE'));
        const couponPeriod = toNumber(sec(row, 'COUPONPERIOD'));
        // Для флоатеров (ПК) купон будущих периодов не зафиксирован → COUPONVALUE=0:
        // в этом случае доходность не считаем (null → «—»), а не показываем 0%.
        const annualCoupon =
            couponPeriod > 0 && couponValue > 0 ? (couponValue * 365) / couponPeriod : null;
        const couponYieldToNominal =
            annualCoupon !== null && faceValue > 0 ? (annualCoupon / faceValue) * 100 : null;
        const couponYieldToPrice =
            annualCoupon !== null && priceValue !== null && priceValue > 0
                ? (annualCoupon / priceValue) * 100
                : null;

        const hasOffer =
            hasValue(sec(row, 'OFFERDATE')) ||
            hasValue(sec(row, 'PUTOPTIONDATE')) ||
            hasValue(sec(row, 'CALLOPTIONDATE'));

        return {
            id: secid,
            secid,
            shortName,
            name,

            couponType: deriveCouponType(bondType, name, couponPercent),
            bondType,
            // «Амортизируемые» от биржи (для всего рынка) или код АД у ОФЗ.
            // Оговорка: амортизирующие флоатеры MOEX метит «Флоатер» → ~10% не ловим.
            hasAmortization: bondType === 'Амортизируемые облигации' || code === 'АД',
            hasOffer,

            couponPercent,
            couponValue,
            couponPeriod,
            annualCoupon,
            couponYieldToNominal,
            couponYieldToPrice,
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

            secType,
            issuerType,
            // Сектор — только для корпоратов; гос/муни классифицируем не по отрасли.
            sector: issuerType === 'corporate' ? sectorByShortName(shortName) : '',
            // MOEX ISS не отдаёт кредитный рейтинг — подключим внешний источник для корпоратов.
            creditRating: null,

            isin: sec<string>(row, 'ISIN') ?? ''
        };
    });
};
