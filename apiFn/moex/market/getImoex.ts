import { apiMoex } from '../instance';

export interface IndexQuote {
    /** Текущее значение индекса. */
    value: number;
    /** Изменение за день в процентах к предыдущему закрытию. */
    changePct: number;
}

/**
 * Текущее значение индекса Мосбиржи (IMOEX) с дневным изменением.
 * ISS отдаёт таблицу marketdata: CURRENTVALUE — текущее значение,
 * LASTCHANGEPRC — процент к предыдущему закрытию.
 */
export const getImoex = async (): Promise<IndexQuote> => {
    const { data } = await apiMoex.get(
        'iss/engines/stock/markets/index/securities/IMOEX.json?iss.meta=off&iss.only=marketdata'
    );

    const columns: string[] = data.marketdata.columns;
    const row: unknown[] = data.marketdata.data[0] ?? [];
    const value = (column: string) => Number(row[columns.indexOf(column)]);

    return {
        value: value('CURRENTVALUE'),
        changePct: value('LASTCHANGEPRC')
    };
};
