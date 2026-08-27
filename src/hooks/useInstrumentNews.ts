import { getInstrumentNewsTinkoff } from '@api/tinkoff/getInstrumentNews/getInstrumentNews';
import { useQuery } from '@tanstack/react-query';

/**
 * Лента Пульса по инструменту (акция по тикеру или облигация по SECID).
 * Источник — соцсеть Т-Банка. В ОТЛИЧИЕ от дивидендов/фундаментала/прогнозов
 * эндпоинт публичный, поэтому токен НЕ нужен — лента видна всем. Обновляется
 * часто, но не ежесекундно → staleTime 3 мин.
 */
export const useInstrumentNews = (ticker: string) =>
    useQuery({
        queryKey: ['instrument-news', ticker],
        queryFn: () => getInstrumentNewsTinkoff(ticker),
        enabled: !!ticker,
        staleTime: 1000 * 60 * 3
    });
