import { IIndicesRaw } from '@models/marketIndex';
import { apiMoex } from '../instance';

/**
 * Сырой список всех индексов Московской биржи с борда SNDX. Один запрос отдаёт и
 * справочник (securities: SECID/NAME/CALCMODE/DECIMALS/CURRENCYID), и live-значения
 * (marketdata: CURRENTVALUE/LASTCHANGEPRC/MONTHCHANGEPRC/YEARCHANGEPRC/VALTODAY) —
 * так же, как борд TQBR у фондов. Маппинг и джойн — в mapIndices.
 */
export const getIndices = async (): Promise<IIndicesRaw> => {
    const { data } = await apiMoex.get<IIndicesRaw>(
        'iss/engines/stock/markets/index/boards/SNDX/securities.json?iss.meta=off'
    );

    return data;
};
