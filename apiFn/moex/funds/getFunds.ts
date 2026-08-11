import { IFundsRaw } from '@models/fund';
import { apiMoex } from '../instance';

/**
 * Сырой список бумаг основного борда TQBR. Биржевые фонды (БПИФ/ETF) торгуются
 * там же, где акции, и отличаются кодом SECTYPE='J' (отбор — в mapFunds).
 * Старые борды TQTF/TQIF сейчас пусты, поэтому берём TQBR.
 */
export const getFunds = async (): Promise<IFundsRaw> => {
    const { data } = await apiMoex.get<IFundsRaw>(
        'iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off'
    );

    return data;
};
