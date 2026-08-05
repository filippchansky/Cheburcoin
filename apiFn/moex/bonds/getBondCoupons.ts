import { IBondCoupon } from '@models/bondDetail';
import { columnGetter, toNumber, toNumberOrNull } from '../columnUtils';
import { apiMoex } from '../instance';

interface BondizationRaw {
    coupons: { columns: string[]; data: unknown[][] };
}

/** Расписание купонных выплат облигации (прошедшие + предстоящие). */
export const getBondCoupons = async (secid: string): Promise<IBondCoupon[]> => {
    const { data } = await apiMoex.get<BondizationRaw>(
        `iss/securities/${secid}/bondization.json?iss.meta=off&limit=100`
    );

    const get = columnGetter(data.coupons.columns);
    const now = Date.now();

    return data.coupons.data.map((row) => {
        const date = get<string>(row, 'coupondate') ?? '';
        return {
            date,
            percent: toNumberOrNull(get(row, 'valueprc')),
            value: toNumber(get(row, 'value')),
            isPaid: date ? new Date(date).getTime() < now : false
        };
    });
};
