import { getFunds } from '@api/moex/funds/getFunds';
import { mapFunds } from '@api/moex/funds/mapFunds';
import { IFund, IFundsRaw } from '@models/fund';
import { useQuery } from '@tanstack/react-query';

/**
 * Все биржевые фонды (БПИФ/ETF) с TQBR одним списком. Неликвид без цены LAST
 * отсекаем — по нему нельзя показать ни цену, ни изменение.
 */
const mapAllFunds = (raw: IFundsRaw): IFund[] =>
    mapFunds(raw).filter((fund) => fund.price !== null);

/** Список всех биржевых фондов, типизированный и с выведенной категорией. */
export const useFunds = () =>
    useQuery({
        queryKey: ['funds', 'all'],
        queryFn: getFunds,
        select: mapAllFunds
    });
