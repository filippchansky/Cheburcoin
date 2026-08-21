import { useQuery } from '@tanstack/react-query';
import { IPosition } from '@models/tinkoffData';
import { BybitCoinBalance } from '@/lib/bybit/types';
import { bybitToPositions } from '@/lib/bybit/toPositions';
import { fetchUsdRub } from '@/lib/bybit/prices';
import { useBybit } from './useBybit';

const MINUTE = 60_000;

export interface BybitPortfolio {
    positions: IPosition[];
    /** Суммарная стоимость крипты на Bybit, ₽. */
    total: number;
    /** Суммарное изменение за день, ₽ (пока 0 — 24h-change в follow-up). */
    dailyTotal: number;
    /** Подключён ли Bybit (заданы оба ключа). */
    hasCreds: boolean;
    isLoading: boolean;
    isError: boolean;
    error?: string;
    refetch: () => void;
}

/** Балансы с приватного прокси Bybit (подпись на сервере). */
const fetchBybitBalances = async (
    apiKey: string,
    apiSecret: string
): Promise<BybitCoinBalance[]> => {
    const res = await fetch('/api/bybit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ op: 'wallet-balance', apiKey, apiSecret })
    });
    if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || `Bybit ${res.status}`);
    }
    const json = (await res.json()) as { balances: BybitCoinBalance[] };
    return json.balances ?? [];
};

/**
 * Крипто-часть портфеля с биржи Bybit: балансы аккаунта (через подписанный прокси)
 * + курс USD→RUB → позиции IPosition. Вливается в usePortfolio синтетическим
 * счётом, как крипта Trezor.
 */
export const useBybitPositions = (): BybitPortfolio => {
    const { data: creds } = useBybit();
    const apiKey = creds?.apiKey ?? null;
    const apiSecret = creds?.apiSecret ?? null;
    const hasCreds = Boolean(apiKey && apiSecret);

    const balancesQuery = useQuery({
        // Ключи вне queryKey (не светим в devtools-кэше) — используем uid-неявно
        // через инвалидацию ['bybit'] в мутациях useBybit; здесь метка наличия.
        queryKey: ['portfolio-bybit', 'balances', hasCreds],
        queryFn: () => fetchBybitBalances(apiKey as string, apiSecret as string),
        enabled: hasCreds,
        staleTime: MINUTE,
        refetchOnWindowFocus: false
    });

    const rateQuery = useQuery({
        queryKey: ['portfolio-bybit', 'usdrub'],
        queryFn: fetchUsdRub,
        enabled: hasCreds,
        staleTime: MINUTE,
        refetchOnWindowFocus: false
    });

    const balances = balancesQuery.data ?? [];
    const usdRub = rateQuery.data ?? 0;

    const positions = usdRub ? bybitToPositions(balances, usdRub) : [];
    const total = positions.reduce((sum, p) => sum + (p.priceInPorfolio ?? 0), 0);

    return {
        positions,
        total: Number(total.toFixed(2)),
        dailyTotal: 0,
        hasCreds,
        isLoading: balancesQuery.isLoading || rateQuery.isLoading,
        isError: balancesQuery.isError || rateQuery.isError,
        error:
            balancesQuery.error instanceof Error
                ? balancesQuery.error.message
                : rateQuery.isError
                  ? 'Не удалось получить курс USD/RUB'
                  : undefined,
        refetch: () => {
            balancesQuery.refetch();
            rateQuery.refetch();
        }
    };
};
