import { IShareDividend } from '@models/shareDetail';
import { apiTinkoff } from '../instance';

/** Одна выплата из истории дивидендов Т-Банка (страница акции). */
export interface ITinkoffDividend extends IShareDividend {
    /** Историческая дивдоходность на момент выплаты, % (может отсутствовать). */
    yield: number | null;
    /** Дата фактической выплаты (ISO) — необязательна. */
    paymentDate: string | null;
    dividendType: string | null;
}

/**
 * История дивидендов одной акции через прокси `POST /share-dividends`.
 * Замена мёртвому эндпоинту MOEX: биржа закрыла бесплатную выдачу дивидендов,
 * поэтому источник — Т-Банк (GetDividends), а значит нужен токен пользователя.
 * `from`/`to` — окно по дате отсечки (RFC3339). Ошибку пробрасываем — react-query
 * различит loading/error/success.
 */
export const getShareDividendsTinkoff = async (
    ticker: string,
    from: string,
    to: string,
    token: string
): Promise<ITinkoffDividend[]> => {
    const res = await apiTinkoff.post(
        '/share-dividends',
        { ticker, from, to },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data?.dividends ?? [];
};
