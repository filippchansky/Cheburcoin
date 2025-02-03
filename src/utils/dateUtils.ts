export const getYearAgo = () => {
    const currentDate = new Date();

    // Вычитаем один год из текущей даты
    const yearAgoDate = new Date(currentDate);
    yearAgoDate.setFullYear(currentDate.getFullYear() - 1);

    // Выводим результат
    return yearAgoDate.toISOString().split('T')[0];
};

export const getSixMonthAgo = () => {
    const currentDate = new Date();

    // Вычитаем полгода из текущей даты
    const halfYearAgoDate = new Date(currentDate);
    halfYearAgoDate.setMonth(currentDate.getMonth() - 6);

    // Выводим результат
    return halfYearAgoDate.toISOString().split('T')[0];
};

export const getMonthAgo = () => {
    const currentDate = new Date();

    // Месяц назад
    const monthAgoDate = new Date(currentDate);
    monthAgoDate.setMonth(currentDate.getMonth() - 1);

    return monthAgoDate.toISOString().split('T')[0];
};

export const getWeekAgo = () => {
    const currentDate = new Date();
    const weekAgoDate = new Date(currentDate);
    weekAgoDate.setDate(currentDate.getDate() - 7);

    return weekAgoDate.toISOString().split('T')[0];
};

export const getFiveDayAgo = () => {
    const currentDate = new Date();
    const dayAgoDate = new Date(currentDate);
    dayAgoDate.setDate(currentDate.getDate() - 5);

    return dayAgoDate.toISOString().split('T')[0];
};

export const getTwoMonthsAgo = () => {
    const currentDate = new Date();
    const twoMonthsAgoDate = new Date(currentDate);
    twoMonthsAgoDate.setMonth(currentDate.getMonth() - 2.5);

    return twoMonthsAgoDate.toISOString().split('T')[0];
};

export const getFiveYearsAgo = () => {
    const currentDate = new Date();

    // Вычитаем один год из текущей даты
    const yearAgoDate = new Date(currentDate);
    yearAgoDate.setFullYear(currentDate.getFullYear() - 5);

    // Выводим результат
    return yearAgoDate.toISOString().split('T')[0];
};

export const getFiveTenYearsAgo = () => {
    const currentDate = new Date();

    // Вычитаем один год из текущей даты
    const yearAgoDate = new Date(currentDate);
    yearAgoDate.setFullYear(currentDate.getFullYear() - 15);

    // Выводим результат
    return yearAgoDate.toISOString().split('T')[0];
};

export const formatDateToDayMonth = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}`;
};
