/**
 * MOEX ISS отдаёт данные в «колоночном» формате (массив columns + массив строк-массивов).
 * Эти утилиты позволяют обращаться к ячейкам по имени колонки, а не по хрупкому индексу.
 */

/** Возвращает функцию доступа к ячейке строки по имени колонки. */
export const columnGetter = (columns: string[]) => {
    const index = new Map(columns.map((name, i) => [name, i]));
    return <T = number>(row: unknown[], name: string): T => {
        const i = index.get(name);
        return (i === undefined ? undefined : row[i]) as T;
    };
};

/** Приводит значение к числу; при некорректном значении возвращает 0. */
export const toNumber = (value: unknown): number => {
    const n = typeof value === 'string' ? Number(value) : (value as number);
    return Number.isFinite(n) ? n : 0;
};

/** Приводит значение к числу; при пустом/некорректном значении возвращает null. */
export const toNumberOrNull = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const n = typeof value === 'string' ? Number(value) : (value as number);
    return Number.isFinite(n) ? n : null;
};
