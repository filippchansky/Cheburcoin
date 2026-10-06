import { FutureGroup } from '@models/marketFuture';

/** Человекочитаемые названия групп фьючерсов. */
export const FUTURE_GROUP_LABEL: Record<FutureGroup, string> = {
    currency: 'Валюта',
    index: 'Индексы',
    commodity: 'Товары',
    stock: 'Акции',
    rate: 'Ставки',
    crypto: 'Крипта'
};

/** Цвет тега группы (палитра antd). */
export const FUTURE_GROUP_COLOR: Record<FutureGroup, string> = {
    currency: 'gold',
    index: 'geekblue',
    commodity: 'volcano',
    stock: 'green',
    rate: 'cyan',
    crypto: 'purple'
};

/**
 * Явные наборы ASSETCODE по группам. Одиночные акции (самая большая часть FORTS) в
 * наборы не заносим — они попадают в 'stock' по умолчанию. Наборы проверяются в
 * порядке crypto → currency → index → rate → commodity, поэтому пересечений быть не
 * должно (напр. GLDRUBF — товар в рублях, а не валюта). MOEX иногда добавляет активы —
 * незнакомый код без совпадений уедет в 'stock' (безопасный дефолт).
 */
const CRYPTO = new Set(['BTC', 'ETH', 'ETHA', 'SOL', 'XRP', 'TRX', 'IBIT']);

const CURRENCY = new Set([
    'Si', 'Eu', 'ED', 'CNY', 'GBPU', 'AUDU', 'HKD', 'INR', 'KZT', 'TRY', 'BYN', 'AED',
    'USDM', 'EURM', 'UCAD', 'UCHF', 'UCNY', 'UINR', 'UJPY', 'UKZT', 'UTRY',
    'EGBP', 'EJPY', 'ECAD', 'MOEXCNY',
    // Вечные валютные фьючерсы (ASSETCODE = *RUBTOM).
    'USDRUBTOM', 'EURRUBTOM', 'CNYRUBTOM'
]);

const INDEX = new Set([
    'RTS', 'RTSM', 'MIX', 'MXI', 'MMI', 'IMOEX', 'RVI',
    // Зарубежные и страновые индексы.
    'SP500F', 'SPYF', 'NASD', 'DJ30', 'DAX', 'STOX', 'NIKK', 'HANG', 'R2000', 'SOXQ', 'QQQF',
    'EM', 'AFRICA', 'BRAZIL', 'CHINA', 'INDIA', 'KOREA', 'SAUDI', 'ARGT',
    'CNI', 'FNI', 'GL', 'SL', 'IPO', 'HOME'
]);

const RATE = new Set(['RUON', 'RUONIA', '1MFR', 'RGBI', 'RGBIF', 'TLT']);

const COMMODITY = new Set([
    'BR', 'BRM', 'WTI', 'NG', 'NGM', 'TTF', 'AI92', 'AI95', 'DTL',
    'GOLD', 'GOLDM', 'GLDRUBTOM', 'SILV', 'SILVM', 'SLVRUBTOM',
    'PLT', 'PLTM', 'PLD', 'PLDM', 'COPPER', 'NICKEL', 'ZINC', 'ALUM',
    'SUGAR', 'SUGR', 'WHEAT', 'COCOA', 'COFFEE', 'RAGR', 'OGI'
]);

/**
 * Определяет смысловую группу фьючерса по коду базового актива. Сначала точные наборы
 * (крипта → валюта → индексы → ставки → товары), всё остальное — «Акции» (одиночные
 * бумаги, которых большинство). Название пока не используем: ASSETCODE у FORTS
 * стабилен и однозначен.
 */
export const deriveFutureGroup = (assetCode: string): FutureGroup => {
    const code = String(assetCode ?? '');
    if (CRYPTO.has(code)) return 'crypto';
    if (CURRENCY.has(code)) return 'currency';
    if (INDEX.has(code)) return 'index';
    if (RATE.has(code)) return 'rate';
    if (COMMODITY.has(code)) return 'commodity';
    return 'stock';
};
