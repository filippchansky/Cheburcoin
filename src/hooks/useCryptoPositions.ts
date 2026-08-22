import { useQuery } from '@tanstack/react-query';
import { IPosition } from '@models/tinkoffData';
import { readBalances, BalanceError, CryptoBalance } from '@/lib/trezor/balances';
import { fetchCryptoPricesRub } from '@/lib/trezor/prices';
import { cryptoToPositions } from '@/lib/trezor/toPositions';
import { lotsToAvgPrices } from '@/lib/portfolio/cryptoLots';
import { useTrezor } from './useTrezor';
import { useCryptoLots } from './useCryptoLots';

const MINUTE = 60_000;

export interface CryptoPortfolio {
    positions: IPosition[];
    /** Суммарная стоимость крипты, ₽. */
    total: number;
    /** Суммарное изменение за день, ₽. */
    dailyTotal: number;
    /** Сырые балансы (в т.ч. нулевые) — для диагностики. */
    raw: CryptoBalance[];
    /** Ошибки получения баланса/цены — для диагностики в дашборде. */
    errors: BalanceError[];
    /** Есть ли вообще подключённые счета Trezor. */
    hasAccounts: boolean;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
}

/**
 * Крипто-часть портфеля: балансы по дескрипторам Trezor (без устройства) + цены
 * в ₽ (CoinGecko, один запрос) → позиции IPosition. Вливается в usePortfolio как
 * синтетический счёт.
 */
export const useCryptoPositions = (): CryptoPortfolio => {
    const { data: accounts = [] } = useTrezor();
    const { data: lots } = useCryptoLots();

    const coinKeys = Array.from(new Set(accounts.map((a) => a.coin)));
    const descriptors = accounts.map((a) => `${a.coin}:${a.descriptor}`).join(',');

    const balancesQuery = useQuery({
        queryKey: ['portfolio-crypto', 'balances', descriptors],
        queryFn: () => readBalances(accounts),
        enabled: accounts.length > 0,
        staleTime: MINUTE,
        refetchOnWindowFocus: false
    });

    const pricesQuery = useQuery({
        queryKey: ['portfolio-crypto', 'prices', coinKeys.join(',')],
        queryFn: () => fetchCryptoPricesRub(coinKeys),
        enabled: coinKeys.length > 0,
        staleTime: MINUTE,
        refetchOnWindowFocus: false
    });

    const balanceResult = balancesQuery.data ?? { balances: [], errors: [] };
    const prices = pricesQuery.data ?? {};

    const avgPrices = lotsToAvgPrices(lots ?? {});
    const positions = cryptoToPositions(balanceResult.balances, prices, avgPrices);
    const total = positions.reduce((sum, p) => sum + (p.priceInPorfolio ?? 0), 0);
    const dailyTotal = positions.reduce((sum, p) => sum + (p.dailyYield ?? 0), 0);

    const errors: BalanceError[] = [...balanceResult.errors];
    if (pricesQuery.isError) {
        errors.push({ coin: 'цены', error: 'Не удалось получить курсы (CoinGecko).' });
    }

    return {
        positions,
        total: Number(total.toFixed(2)),
        dailyTotal: Number(dailyTotal.toFixed(2)),
        raw: balanceResult.balances,
        errors,
        hasAccounts: accounts.length > 0,
        isLoading: balancesQuery.isLoading || pricesQuery.isLoading,
        isError: balancesQuery.isError || pricesQuery.isError,
        refetch: () => {
            balancesQuery.refetch();
            pricesQuery.refetch();
        }
    };
};
