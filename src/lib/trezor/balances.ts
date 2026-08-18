/**
 * Чтение баланса по сохранённым дескрипторам — БЕЗ Trezor Connect и без устройства.
 *
 * Trezor Connect для баланса не используем: его getAccountInfo тащит локальный
 * транспорт устройства (Bridge/WebUSB) и зависает без него. Дескриптор у нас уже
 * есть — читаем публичными сервисами напрямую (CORS-friendly, без ключей):
 *  • evm (ETH)    → JSON-RPC eth_getBalance(address) → wei (hex).
 *  • solana (SOL) → JSON-RPC getBalance(address) → lamports.
 *  • utxo (BTC)   → Blockbook REST /api/v2/xpub/{xpub} → balance (сатоши).
 *
 * На MVP берём только НАТИВНУЮ монету (ERC-20/SPL — задел на будущее).
 */
import { ITrezorAccount } from '@models/trezor';
import { trezorCoinByKey, TrezorCoinConfig } from './coins';

export interface CryptoBalance {
    /** Ключ монеты (BTC/ETH/SOL). */
    coin: string;
    /** Баланс в монетах (уже поделён на 10^decimals). */
    amount: number;
}

export interface BalanceError {
    coin: string;
    error: string;
}

export interface ReadBalancesResult {
    balances: CryptoBalance[];
    errors: BalanceError[];
}

/** База (минимальные единицы) → монеты по decimals. Принимает число/строку/hex. */
const toCoins = (raw: string | number | undefined, decimals: number): number => {
    const n = typeof raw === 'string' ? Number(raw) : raw ?? 0;
    if (!Number.isFinite(n)) return 0;
    return n / 10 ** decimals;
};

/** Одиночный JSON-RPC вызов. */
const rpcCall = async (url: string, method: string, params: unknown[]): Promise<any> => {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
    });
    if (!res.ok) throw new Error(`${method} ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message ?? `${method} error`);
    return json.result;
};

interface BlockbookResult {
    balance: string;
    stakingPools?: Array<{
        depositedBalance?: string;
        autocompoundBalance?: string;
        restakedReward?: string;
        pendingBalance?: string;
        pendingDepositedBalance?: string;
    }>;
}

/** Запрос к нашему серверному Blockbook-прокси (обход CORS/UA). */
const blockbook = async (chain: 'eth' | 'btc', descriptor: string): Promise<BlockbookResult> => {
    const res = await fetch('/api/blockbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chain, descriptor })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? `blockbook ${res.status}`);
    return json;
};

/** Сумма «застейканного» из пулов Everstake (wei-строки), в базовых единицах. */
const sumStaking = (pools: BlockbookResult['stakingPools']): number =>
    (pools ?? []).reduce((sum, p) => {
        const fields = [
            p.depositedBalance,
            p.autocompoundBalance,
            p.restakedReward,
            p.pendingBalance,
            p.pendingDepositedBalance
        ];
        return sum + fields.reduce((s, v) => s + (v ? Number(v) : 0), 0);
    }, 0);

/**
 * Баланс ETH через Blockbook-прокси: ликвид + стейкинг (Everstake). RPC не даёт
 * стейкинг, поэтому идём через Blockbook, где он приходит в stakingPools.
 */
const readEvmBalance = async (config: TrezorCoinConfig, address: string): Promise<number> => {
    const data = await blockbook('eth', address);
    const base = Number(data.balance) + sumStaking(data.stakingPools);
    return toCoins(base, config.decimals);
};

/**
 * Баланс SOL: ликвид через JSON-RPC getBalance. Стейкинг SOL здесь НЕ учитываем —
 * его достаёт только getProgramAccounts по Stake-программе, а публичные ноды его
 * режут (нужен платный RPC/индексатор). См. заметку в плане.
 */
const readSolanaBalance = async (config: TrezorCoinConfig, address: string): Promise<number> => {
    if (!config.rpcUrl) throw new Error('no rpcUrl');
    const result = await rpcCall(config.rpcUrl, 'getBalance', [address]);
    return toCoins(result?.value, config.decimals);
};

/** Баланс BTC через Blockbook-прокси по xpub (агрегирует адреса счёта). */
const readUtxoBalance = async (config: TrezorCoinConfig, xpub: string): Promise<number> => {
    const data = await blockbook('btc', xpub);
    return toCoins(data.balance, config.decimals);
};

/** Баланс одного счёта; бросает при сбое (обрабатываем в readBalances). */
const readOne = async (account: ITrezorAccount): Promise<CryptoBalance> => {
    const config = trezorCoinByKey(account.coin);
    if (!config) throw new Error(`Неизвестная монета ${account.coin}`);

    let amount: number;
    if (config.adapter === 'evm') amount = await readEvmBalance(config, account.descriptor);
    else if (config.adapter === 'solana') amount = await readSolanaBalance(config, account.descriptor);
    else amount = await readUtxoBalance(config, account.descriptor);

    return { coin: account.coin, amount };
};

/**
 * Балансы по всем подключённым счетам. Сбой одного счёта не роняет остальные —
 * возвращаем и успехи, и ошибки (ошибки показываем в дашборде + пишем в консоль,
 * чтобы «пусто» было диагностируемым, а не молчаливым).
 */
export const readBalances = async (accounts: ITrezorAccount[]): Promise<ReadBalancesResult> => {
    const settled = await Promise.allSettled(accounts.map(readOne));
    const balances: CryptoBalance[] = [];
    const errors: BalanceError[] = [];

    settled.forEach((r, i) => {
        if (r.status === 'fulfilled') {
            balances.push(r.value);
        } else {
            const coin = accounts[i]?.coin ?? '?';
            const error = r.reason instanceof Error ? r.reason.message : String(r.reason);
            errors.push({ coin, error });
            // eslint-disable-next-line no-console
            console.warn(`[trezor] баланс ${coin} не получен:`, error);
        }
    });

    return { balances, errors };
};
