/**
 * Единый реестр валют — источник правды для форматирования сумм по всему проекту.
 *
 * Зачем: раньше рубль хардкодился (`intToRub`), а валюто-осведомлённый вывод жил
 * только в облигациях. Реестр разделяет ФИАТ (форматируется через Intl по ISO-4217)
 * и КРИПТУ (не входит в ISO — Intl style:'currency' на ней бросает RangeError,
 * поэтому формат ручной). Крипто-раздел пока не реализован, но API уже учитывает
 * kind:'crypto' — задел, чтобы позже не переписывать сигнатуру formatAmount.
 */

export type CurrencyKind = 'fiat' | 'crypto';

export interface CurrencyMeta {
    /** Канонический код: ISO-4217 для фиата (RUB/USD/…) или тикер для крипты (BTC). */
    code: string;
    kind: CurrencyKind;
    /** Символ валюты. У фиата — для компактного/ручного вывода; у крипты — основной. */
    symbol?: string;
    /** Знаков после запятой по умолчанию. Фиат — 2; крипта — больше (BTC — 8). */
    digits: number;
}

/**
 * Коды-синонимы → канонический код. MOEX ISS отдаёт рубль как «SUR», Т-Банк —
 * коды в нижнем регистре («rub»); нормализация в normalizeCurrency их сводит.
 */
const ALIASES: Record<string, string> = {
    SUR: 'RUB',
    RUR: 'RUB',
    XBT: 'BTC'
};

/** Приводит любой код валюты к канону: верхний регистр + разбор синонимов. */
export const normalizeCurrency = (code?: string | null): string => {
    if (!code) return 'RUB';
    const upper = code.trim().toUpperCase();
    return ALIASES[upper] ?? upper;
};

/** Фиатные валюты, встречающиеся на MOEX и в портфеле Т-Банка. */
const FIAT: Record<string, CurrencyMeta> = {
    RUB: { code: 'RUB', kind: 'fiat', symbol: '₽', digits: 2 },
    USD: { code: 'USD', kind: 'fiat', symbol: '$', digits: 2 },
    EUR: { code: 'EUR', kind: 'fiat', symbol: '€', digits: 2 },
    CNY: { code: 'CNY', kind: 'fiat', symbol: '¥', digits: 2 },
    GBP: { code: 'GBP', kind: 'fiat', symbol: '£', digits: 2 },
    HKD: { code: 'HKD', kind: 'fiat', symbol: 'HK$', digits: 2 },
    CHF: { code: 'CHF', kind: 'fiat', symbol: '₣', digits: 2 },
    JPY: { code: 'JPY', kind: 'fiat', symbol: '¥', digits: 0 },
    KZT: { code: 'KZT', kind: 'fiat', symbol: '₸', digits: 2 },
    BYN: { code: 'BYN', kind: 'fiat', symbol: 'Br', digits: 2 },
    AMD: { code: 'AMD', kind: 'fiat', symbol: '֏', digits: 2 },
    TRY: { code: 'TRY', kind: 'fiat', symbol: '₺', digits: 2 }
};

/**
 * Криптовалюты. Формат ручной (не ISO — Intl style:'currency' на них бросает):
 * formatAmount выводит «количество + тикер/символ» с повышенной точностью.
 * Монеты добавляем по мере поддержки в портфеле Trezor (см. lib/trezor/coins).
 */
const CRYPTO: Record<string, CurrencyMeta> = {
    BTC: { code: 'BTC', kind: 'crypto', symbol: '₿', digits: 8 },
    ETH: { code: 'ETH', kind: 'crypto', symbol: 'Ξ', digits: 6 },
    SOL: { code: 'SOL', kind: 'crypto', symbol: 'SOL', digits: 4 },
    USDT: { code: 'USDT', kind: 'crypto', symbol: '₮', digits: 2 },
    USDC: { code: 'USDC', kind: 'crypto', symbol: 'USDC', digits: 2 }
};

/**
 * Метаданные валюты по коду. Неизвестный код трактуем как фиат с 2 знаками —
 * безопасный дефолт: formatAmount при неизвестном ISO-коде сам откатится на
 * «число + код», не роняя рендер.
 */
export const currencyMeta = (code?: string | null): CurrencyMeta => {
    const c = normalizeCurrency(code);
    return FIAT[c] ?? CRYPTO[c] ?? { code: c, kind: 'fiat', digits: 2 };
};

/** Символ валюты для подписей полей (addon у инпута и т.п.). Нет символа — код. */
export const currencySymbol = (code?: string | null): string => {
    const meta = currencyMeta(code);
    return meta.symbol ?? meta.code;
};
