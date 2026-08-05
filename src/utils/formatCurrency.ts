export const intToRub = (price: number | string) => {
    // Преобразуем строку в число, если нужно
    const numericPrice = typeof price === 'string' ? Number(price) : price;

    // Проверяем, является ли число валидным (не NaN)
    if (isNaN(numericPrice)) {
        return 'Ошибка: некорректное число';
    }

    // Форматируем в рубли
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 2
    }).format(numericPrice);
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

/** MOEX использует код «SUR» для рубля — Intl понимает только «RUB». */
const CURRENCY_CODE: Record<string, string> = { SUR: 'RUB' };

/** Формат суммы в валюте бумаги (SUR/USD/EUR/CNY). */
export const formatMoney = (value: number, currency = 'SUR') =>
    new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: CURRENCY_CODE[currency] ?? currency,
        minimumFractionDigits: 2
    }).format(value);

/** Компактный формат валюты для больших чисел: 6.17e12 → «6,2 трлн ₽». */
export const intToRubCompact = (value: number) =>
    new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(value);
