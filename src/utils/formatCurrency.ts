import { currencyMeta } from './currencyRegistry';

export interface FormatAmountOptions {
    /** Компактная запись больших чисел: 6.17e12 → «6,2 трлн ₽». */
    compact?: boolean;
    /** Явный знак: «+» для прибыли, «−» для убытка (Intl сам «+» не ставит). */
    signed?: boolean;
    /** Переопределить число знаков после запятой (по умолчанию — из реестра валюты). */
    digits?: number;
}

/**
 * Единый форматтер денег: сумма в её валюте. Фиат идёт через Intl style:'currency'
 * (по ISO-4217), крипта — вручную (не входит в ISO, Intl на ней бросает). Валюту
 * нормализует реестр (SUR/rur→RUB и т.п.). Неизвестный код откатывается на
 * «число + код» вместо падения рендера.
 */
export const formatAmount = (
    value: number,
    currency: string | null | undefined = 'RUB',
    opts: FormatAmountOptions = {}
): string => {
    if (value == null || isNaN(value)) return '—';

    const meta = currencyMeta(currency);
    const { compact, signed } = opts;
    const digits = opts.digits ?? meta.digits;

    // Знак выносим сами: нужен и явный «+», которого у Intl нет. «−» — U+2212.
    const sign = signed ? (value > 0 ? '+' : value < 0 ? '−' : '') : '';
    const abs = signed ? Math.abs(value) : value;

    // Крипта (и любой не-ISO код) — количество монет + тикер/символ справа.
    if (meta.kind === 'crypto') {
        const num = new Intl.NumberFormat('ru-RU', {
            notation: compact ? 'compact' : 'standard',
            minimumFractionDigits: compact ? 0 : digits,
            maximumFractionDigits: compact ? 1 : digits
        }).format(abs);
        return `${sign}${num} ${meta.symbol ?? meta.code}`;
    }

    // Фиат — через Intl. Неизвестный ISO-код может бросить → откат на «число + код».
    try {
        const num = new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: meta.code,
            notation: compact ? 'compact' : 'standard',
            minimumFractionDigits: compact ? undefined : digits,
            maximumFractionDigits: compact ? 1 : digits
        }).format(abs);
        return `${sign}${num}`;
    } catch {
        const num = new Intl.NumberFormat('ru-RU', {
            notation: compact ? 'compact' : 'standard',
            maximumFractionDigits: compact ? 1 : digits
        }).format(abs);
        return `${sign}${num} ${meta.code}`;
    }
};

/** Сумма в рублях. Обёртка над formatAmount с валидацией строк (обратная совместимость). */
export const intToRub = (price: number | string) => {
    const numericPrice = typeof price === 'string' ? Number(price) : price;
    if (isNaN(numericPrice)) {
        return 'Ошибка: некорректное число';
    }
    return formatAmount(numericPrice, 'RUB');
};

export const getPercentageChange = (price: number, openPrice: number) => {
    if (openPrice === 0) return '∞%'; // Защита от деления на 0

    const difference = ((price - openPrice) / openPrice) * 100;
    return `${difference > 0 ? '+' + difference.toFixed(2) : difference.toFixed(2)}%`; // Округляем до 2 знаков
};

/** Форматирует готовое процентное изменение в строку со знаком: 1.23 → «+1.23%». */
export const formatPercent = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
};

/** Формат суммы в валюте бумаги (SUR/USD/EUR/CNY). Обёртка над formatAmount. */
export const formatMoney = (value: number, currency = 'SUR') => formatAmount(value, currency);

/** Компактный формат валюты для больших чисел: 6.17e12 → «6,2 трлн ₽». */
export const intToRubCompact = (value: number) => formatAmount(value, 'RUB', { compact: true });

/** Компактный формат числа: 21586948000 → «21,6 млрд». */
export const intToCompact = (value: number) =>
    new Intl.NumberFormat('ru-RU', {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(value);

/** Разделяет разряды пробелами: 1234567 → «1 234 567». */
export const intToGrouped = (value: number) => new Intl.NumberFormat('ru-RU').format(value);
