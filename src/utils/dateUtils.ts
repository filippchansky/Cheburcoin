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

/** «2027-02-03» → «03.02.2027». Пустая/битая дата → «—». */
export const formatDate = (dateString: string) => {
    if (!dateString || dateString === '0000-00-00') return '—';
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
};

const fullDateMskFmt = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Moscow'
});

/**
 * ISO-дата ИЛИ дата-время («2026-05-14T21:00:00Z») → «15.05.2026» по Москве.
 * В отличие от formatDate, корректно ест таймстемпы операций Т-Банка (там время
 * есть) и показывает календарный день так же, как приложение брокера (МСК).
 */
export const formatDateTime = (iso?: string | null) => {
    if (!iso) return '—';
    const dt = new Date(iso);
    return Number.isNaN(dt.getTime()) ? '—' : fullDateMskFmt.format(dt);
};

/** Разбирает ISO-дату (может быть со временем) в локальную дату без сдвига по TZ. */
const parseLocalDate = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
};

const dayMonthFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });
const weekdayFmt = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });
const monthYearFmt = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });

/** «2026-08-06» → «6 авг.» (для компактного списка выплат). */
export const formatDayShort = (iso?: string | null) => {
    if (!iso) return '—';
    const dt = parseLocalDate(iso);
    return Number.isNaN(dt.getTime()) ? '—' : dayMonthFmt.format(dt);
};

/** «2026-08-06» → «6 авг., Чт» — дата с днём недели. */
export const formatDayWeekday = (iso?: string | null) => {
    if (!iso) return '—';
    const dt = parseLocalDate(iso);
    if (Number.isNaN(dt.getTime())) return '—';
    const wd = weekdayFmt.format(dt);
    return `${dayMonthFmt.format(dt)}, ${wd.charAt(0).toUpperCase()}${wd.slice(1)}`;
};

/** Ключ месяца «2026-08» → «август 2026» (заголовок группы, без хвоста « г.»). */
export const formatMonthTitle = (monthKey: string) => {
    const dt = parseLocalDate(`${monthKey}-01`);
    return Number.isNaN(dt.getTime()) ? monthKey : monthYearFmt.format(dt).replace(/\s*г\.$/, '');
};

/** Число полных лет от сегодня до указанной даты (для срока до погашения). */
export const yearsUntil = (dateString: string): number | null => {
    if (!dateString || dateString === '0000-00-00') return null;
    const target = new Date(dateString).getTime();
    if (Number.isNaN(target)) return null;
    return (target - Date.now()) / (365.25 * 24 * 60 * 60 * 1000);
};

const absTimeFmt = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
});

/**
 * «Сколько назад» для новостной ленты: «только что», «5 мин назад», «2 ч назад»,
 * «вчера»; старше двух суток — абсолютная дата «14 авг., 21:00». Битая дата → «—».
 */
export const formatTimeAgo = (iso?: string | null): string => {
    if (!iso) return '—';
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return '—';

    const diffMs = Date.now() - dt.getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'только что';
    if (min < 60) return `${min} мин назад`;

    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours} ч назад`;
    if (hours < 48) return 'вчера';

    return absTimeFmt.format(dt);
};

export const getNormalDate = (date: string) => {
    const dateObj = new Date(date);

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
    const year = String(dateObj.getFullYear()).slice(-2);
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
};
