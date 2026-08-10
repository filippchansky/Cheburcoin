import { ICouponsResponse } from '@models/tinkoffData';
import { apiTinkoff } from '../instance';

export interface CouponBondInput {
    instrumentId: string;
    quantity: number;
}

/**
 * Календарь будущих купонов по облигациям портфеля. Батч: список бумаг
 * (instrumentUid + количество) + окно дат RFC3339. Ошибку пробрасываем —
 * react-query различит loading/error/success (как в getPortfolio).
 */
export const getCoupons = async (
    bonds: CouponBondInput[],
    from: string,
    to: string,
    token: string
): Promise<ICouponsResponse> => {
    const res = await apiTinkoff.post(
        '/coupons',
        { bonds, from, to },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};
