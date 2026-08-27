import { getBond } from '@api/moex/bonds/getBond';
import { getBondAmortizations } from '@api/moex/bonds/getBondAmortizations';
import { getBondCandles } from '@api/moex/bonds/getBondCandles';
import { getBondCoupons } from '@api/moex/bonds/getBondCoupons';
import { getAllBonds } from '@api/moex/bonds/getBonds';
import { mapBonds } from '@api/moex/bonds/mapBonds';
import { getBondOffersTinkoff } from '@api/tinkoff/getBondEvents/getBondEvents';
import { BondFlagsMap, BondRatingsData, BondSectorInfo, IBond, IBondsRaw } from '@models/bond';
import { IBondOffer, IKeyRate } from '@models/bondDetail';
import { useQuery } from '@tanstack/react-query';
import { useTbank } from './useTbank';

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

/**
 * Карта «ISIN → {сектор, тип эмитента}» по всему рынку облигаций — для джойна с
 * позициями портфеля (у позиции Т-Банка есть isin, но нет отрасли). В отличие от
 * useBonds здесь НЕ отсекаем неликвид: сектор от наличия котировки не зависит, а
 * портфельная бумага вполне может сегодня не торговаться. Ключуем по ISIN и
 * запасным ключом SECID (оба в верхнем регистре). Переиспользует запрос
 * ['bonds','all'] (дедуп react-query), лишь другой select.
 */
const selectBondSectorMap = (raws: IBondsRaw[]): Record<string, BondSectorInfo> => {
    const map: Record<string, BondSectorInfo> = {};
    raws.flatMap(mapBonds).forEach((bond) => {
        const info: BondSectorInfo = { sector: bond.sector, issuerType: bond.issuerType };
        if (bond.isin) map[bond.isin.toUpperCase()] = info;
        if (bond.secid) map[bond.secid.toUpperCase()] = info;
    });
    return map;
};

/** Справочник секторов облигаций для разбивки портфеля по секторам. */
export const useBondSectorMap = () =>
    useQuery({
        queryKey: ['bonds', 'all'],
        queryFn: getAllBonds,
        select: selectBondSectorMap,
        staleTime: 1000 * 60 * 60
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

/** Результат хука оферт облигации. */
export interface BondOffersData {
    /** Оферты (пут/колл), свежие снизу — по возрастанию даты. */
    offers: IBondOffer[];
    /** Данные ещё грузятся (или ждём токен Т-Банка). */
    isLoading: boolean;
    /** Токена Т-Банка нет — источник оферт недоступен. */
    noToken: boolean;
}

/**
 * Оферты облигации (пут/колл с датами и ценами). Источник — Т-Банк
 * (GetBondEvents), поэтому нужен токен пользователя; без него отдаём `noToken`.
 * Резолв по ISIN на бэке (у облигаций класс-код разный).
 */
export const useBondOffers = (isin: string): BondOffersData => {
    const { data: tbank, isLoading: tbankLoading } = useTbank();
    const token = tbank?.token ?? null;

    const query = useQuery({
        queryKey: ['bond-offers', isin],
        queryFn: () => getBondOffersTinkoff(isin, token as string),
        enabled: !!isin && !!token,
        staleTime: 1000 * 60 * 60 * 12
    });

    return {
        offers: query.data ?? [],
        isLoading: tbankLoading || (query.isLoading && !!token),
        noToken: !tbankLoading && !token
    };
};

/**
 * Признаки надёжности (квал/дефолт) по всем облигациям — статическая карта
 * public/bonds-flags.json, собираемая на этапе сборки (scripts/generateBondFlags.mjs).
 * Файла может не быть в dev/CI (генерится в vercel-build) — тогда возвращаем пустую
 * карту, и фильтры «квал/дефолт» просто ничего не отсекают.
 */
export const useBondFlags = () =>
    useQuery({
        queryKey: ['bond-flags'],
        queryFn: async (): Promise<BondFlagsMap> => {
            const res = await fetch('/bonds-flags.json');
            if (!res.ok) return {};
            return res.json();
        },
        staleTime: Infinity
    });

/**
 * Кредитные рейтинги по всем облигациям — статическая карта public/bond-ratings.json,
 * собираемая локально скриптом scripts/generateBondRatings.mjs из репозитария ЦБ.
 * Файла может не быть — тогда возвращаем пустую карту, и блок рейтинга просто скрыт.
 */
export const useBondRatings = () =>
    useQuery({
        queryKey: ['bond-ratings'],
        queryFn: async (): Promise<BondRatingsData> => {
            const res = await fetch('/bond-ratings.json');
            if (!res.ok) return { issuers: {}, secids: {} };
            return res.json();
        },
        staleTime: Infinity
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
