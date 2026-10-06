import { IFuturesRaw } from '@models/marketFuture';
import { apiMoex } from '../instance';

/**
 * Сырой список всех фьючерсов срочного рынка MOEX (борд FORTS). Один запрос отдаёт и
 * справочник (securities: SECID/ASSETCODE/LASTTRADEDATE/лот/ГО/шаг), и live-значения
 * (marketdata: LAST/LASTTOPREVPRICE/OPENPOSITION/VOLTODAY/VALTODAY) — так же, как борд
 * SNDX у индексов. Маппинг и джойн — в mapFutures.
 */
export const getFutures = async (): Promise<IFuturesRaw> => {
    const { data } = await apiMoex.get<IFuturesRaw>(
        'iss/engines/futures/markets/forts/securities.json?iss.meta=off'
    );

    return data;
};
