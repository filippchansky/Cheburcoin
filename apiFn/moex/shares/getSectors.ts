import { apiMoex } from '../instance';

/** Отраслевые индексы MOEX → человекочитаемое название сектора. */
export const SECTOR_INDICES: Record<string, string> = {
    MOEXOG: 'Нефть и газ',
    MOEXFN: 'Финансы',
    MOEXMM: 'Металлы и добыча',
    MOEXCN: 'Потребительский сектор',
    MOEXEU: 'Электроэнергетика',
    MOEXIT: 'Информационные технологии',
    MOEXTN: 'Транспорт',
    MOEXTL: 'Телекоммуникации',
    MOEXRE: 'Строительный сектор',
    MOEXCH: 'Химия и нефтехимия'
};

interface IndexAnalytics {
    analytics: { columns: string[]; data: unknown[][] };
}

/**
 * Карта «тикер → название сектора», собранная из состава отраслевых индексов MOEX.
 * SECTORID в основном эндпоинте бумаг не заполнен, поэтому берём классификацию отсюда.
 * Индексы тянутся параллельно; сбой одного не роняет остальные.
 */
export const getSectors = async (): Promise<Record<string, string>> => {
    const entries = Object.entries(SECTOR_INDICES);

    const responses = await Promise.all(
        entries.map(([id]) =>
            apiMoex
                .get<IndexAnalytics>(
                    `iss/statistics/engines/stock/markets/index/analytics/${id}.json?iss.meta=off&limit=100`
                )
                .then((res) => res.data)
                .catch(() => null)
        )
    );

    const sectorByTicker: Record<string, string> = {};
    responses.forEach((data, i) => {
        if (!data) return;
        const label = entries[i][1];
        const tickerIndex = data.analytics.columns.indexOf('ticker');
        if (tickerIndex === -1) return;

        data.analytics.data.forEach((row) => {
            const ticker = row[tickerIndex] as string;
            if (ticker) sectorByTicker[ticker] = label;
        });
    });

    return sectorByTicker;
};
