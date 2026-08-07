import { getBond } from '@api/moex/bonds/getBond';
import { getBondAmortizations } from '@api/moex/bonds/getBondAmortizations';
import { getBondCandles } from '@api/moex/bonds/getBondCandles';
import { getBondCoupons } from '@api/moex/bonds/getBondCoupons';
import { getAllBonds } from '@api/moex/bonds/getBonds';
import { mapBonds } from '@api/moex/bonds/mapBonds';
import { IBond, IBondsRaw } from '@models/bond';
import { IKeyRate } from '@models/bondDetail';
import { useQuery } from '@tanstack/react-query';

/**
 * Все облигации рынка (ОФЗ + корпоративные + муниципальные) одним списком.
 * Каждый борд маппится отдельно и объединяется; неликвид (без цены LAST) отсекаем,
 * т.к. по нему нельзя показать ни цену, ни доходность.
 */
const mapAllBonds = (raws: IBondsRaw[]): IBond[] =>
    raws.flatMap(mapBonds).filter((bond) => bond.pricePercent !== null);

/** Список всех облигаций, типизированный и обогащённый производными атрибутами. */
export const useBonds = () =>
    useQuery({
        queryKey: ['bonds', 'all'],
        queryFn: getAllBonds,
        select: mapAllBonds
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

/** График амортизации номинала (пустой массив ⇒ бумага без амортизации). */
export const useBondAmortizations = (secid: string) =>
    useQuery({
        queryKey: ['bond-amortizations', secid],
        queryFn: () => getBondAmortizations(secid),
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
