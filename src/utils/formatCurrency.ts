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
