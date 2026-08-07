import { IBondAmortization } from '@models/bondDetail';
import { columnGetter, toNumber } from '../columnUtils';
import { apiMoex } from '../instance';

interface AmortizationRaw {
    amortizations: { columns: string[]; data: unknown[][] };
}

/**
 * График амортизации номинала облигации.
 *
 * MOEX отдаёт частичные погашения в блоке `amortizations` эндпоинта bondization:
 * строки амортизации помечены `data_source='amortization'`, а обычное погашение в
 * дату погашения — `data_source='maturity'` (его сюда не включаем, это не
 * амортизация). Пустой результат ⇒ бумага без амортизации (bullet).
 *
 * Это единственный способ достоверно узнать про амортизацию: в списочном эндпоинте
 * бумаг такого признака нет, поэтому и в списке `/bonds` фильтр по амортизации есть
 * только у ОФЗ (там тип выводится из названия).
 */
export const getBondAmortizations = async (secid: string): Promise<IBondAmortization[]> => {
    const { data } = await apiMoex.get<AmortizationRaw>(
        `iss/securities/${secid}/bondization.json?iss.meta=off&iss.only=amortizations&limit=100`
    );

    const get = columnGetter(data.amortizations.columns);
    const now = Date.now();

    return data.amortizations.data
        .filter((row) => get<string>(row, 'data_source') === 'amortization')
        .map((row) => {
            const date = get<string>(row, 'amortdate') ?? '';
            return {
                date,
                percent: toNumber(get(row, 'valueprc')),
                value: toNumber(get(row, 'value')),
                isPaid: date ? new Date(date).getTime() < now : false
            };
        });
};
