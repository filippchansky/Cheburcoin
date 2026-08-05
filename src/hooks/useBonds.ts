import { getBond } from '@api/moex/bonds/getBond';
import { getBondCandles } from '@api/moex/bonds/getBondCandles';
import { getBondCoupons } from '@api/moex/bonds/getBondCoupons';
import { getOfzBonds } from '@api/moex/bonds/getOfzBonds';
import { mapBonds } from '@api/moex/bonds/mapBonds';
import { IKeyRate } from '@models/bondDetail';
import { useQuery } from '@tanstack/react-query';

/** Список ОФЗ (борд TQOB), типизированный и обогащённый производными атрибутами. */
export const useOfzBonds = () =>
    useQuery({
        queryKey: ['bonds', 'ofz'],
        queryFn: getOfzBonds,
        select: mapBonds
    });

/** Данные одной облигации по secid. */
export const useBond = (secid: string) =>
    useQuery({
        queryKey: ['bond', secid],
        queryFn: () => getBond(secid),
        enabled: !!secid
    });

/** Свечи графика облигации за период. */
export const useBondCandles = (secid: string, from: string, interval = '24') =>
    useQuery({
        queryKey: ['bond-candles', secid, from, interval],
        queryFn: () => getBondCandles(secid, from, interval),
        enabled: !!secid && !!from
    });

/** Расписание купонов облигации. */
export const useBondCoupons = (secid: string) =>
    useQuery({
        queryKey: ['bond-coupons', secid],
        queryFn: () => getBondCoupons(secid),
        enabled: !!secid
    });

/** Ключевая ставка ЦБ РФ (через наш серверный route /api/key-rate). */
export const useKeyRate = () =>
    useQuery({
        queryKey: ['key-rate'],
        queryFn: async (): Promise<IKeyRate> => {
            const res = await fetch('/api/key-rate');
            if (!res.ok) throw new Error('key rate request failed');
            return res.json();
        },
        staleTime: 1000 * 60 * 60
    });
