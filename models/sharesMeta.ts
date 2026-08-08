/**
 * Статические метаданные акции из build-time карты (public/shares-meta.json).
 * Генерируется скриптом scripts/generateSharesMeta.mjs. Храним ГОДОВОЙ дивиденд
 * на акцию (₽) — доходность считаем на клиенте от живой цены (см. mapShares/MoexPage).
 */
export interface IShareMeta {
    /** Годовой дивиденд на акцию, ₽ (0 — бумага фактически не платит). */
    annualDiv: number;
    /** Дата отсечки последней выплаты (YYYY-MM-DD). */
    lastPayDate: string;
}

/** Карта «тикер → метаданные»; отсутствие ключа = нет истории дивидендов. */
export type SharesMetaMap = Record<string, IShareMeta>;
