/**
 * Тип инструмента в позиции портфеля Т-Банка (`instrumentType` из Tinkoff Invest API).
 * После рефакторинга прокси-бека обогащаются ВСЕ не-валютные позиции, поэтому
 * в таблицу приходят не только акции, но и облигации/фонды/фьючерсы.
 */
export const INSTRUMENT_TYPE_LABEL: Record<string, string> = {
    share: 'Акция',
    bond: 'Облигация',
    etf: 'Фонд',
    currency: 'Валюта',
    futures: 'Фьючерс',
    sp: 'Структурная нота',
    option: 'Опцион'
};

/** Цвета antd Tag для типов инструментов. */
export const INSTRUMENT_TYPE_COLOR: Record<string, string> = {
    share: 'blue',
    bond: 'green',
    etf: 'purple',
    futures: 'orange',
    sp: 'gold',
    option: 'magenta'
};

/** Человекочитаемая метка типа инструмента (fallback — сырой код или «—»). */
export const instrumentTypeLabel = (type?: string | null) =>
    (type && INSTRUMENT_TYPE_LABEL[type]) || type || '—';

/** Типы, которые реально попадают в таблицу позиций (валюта отсекается на беке). */
export const PORTFOLIO_INSTRUMENT_TYPES = ['share', 'bond', 'etf', 'futures'] as const;
