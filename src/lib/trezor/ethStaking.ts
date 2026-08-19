/**
 * Стейкинг ETH (Everstake) через eth_call к контракту пула.
 *
 * Зачем: NOWNodes Blockbook (в отличие от Trezor-сборки btc1/eth1.trezor.io) поле
 * `stakingPools` НЕ отдаёт — приходит только ликвидный баланс. А застейканное лежит
 * в контракте пула Everstake, откуда Trezor его и читал. Дёргаем те же величины
 * напрямую и возвращаем в форме `stakingPools` Blockbook, чтобы клиентский разбор
 * (sumStaking в balances.ts) остался без изменений.
 *
 * Только чтение (eth_call), ключей/подписи не нужно — идём на публичный ETH-RPC
 * (сервер-сайд, поэтому CORS не мешает). Сбой стейкинга не должен ронять ликвид —
 * ошибку обрабатывает вызывающий роут.
 */

/** Контракт пула Everstake (ETH mainnet) — тот же, что светит Trezor в stakingPools. */
const EVERSTAKE_POOL = '0x7a7f0b3c23C23a31cFcb0c44709be70d4D545c6e';

/**
 * Селекторы = keccak256(сигнатура)[:4]. Проверены eth_call'ом против снапшота
 * Trezor Blockbook (совпали по значению):
 *  • autocompoundBalanceOf(address) — ИТОГ стейка (принципал + реинвест. награды);
 *  • pendingBalanceOf / pendingDepositedBalanceOf — депозиты «в пути».
 */
const SELECTORS = {
    autocompound: '0x2fec7966',
    pending: '0x59b8c763',
    pendingDeposited: '0x80f14ecc'
} as const;

/** Форма пула из Blockbook — ровно те поля, что читает sumStaking (balances.ts). */
export interface EthStakingPool {
    autocompoundBalance: string;
    pendingBalance: string;
    pendingDepositedBalance: string;
}

/** Один eth_call к пулу: селектор + адрес (32-байтный паддинг) → uint256 (wei). */
const ethCall = async (rpcUrl: string, selector: string, address: string): Promise<bigint> => {
    const padded = address.toLowerCase().replace(/^0x/i, '').padStart(64, '0');
    const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_call',
            params: [{ to: EVERSTAKE_POOL, data: `${selector}${padded}` }, 'latest']
        }),
        cache: 'no-store'
    });
    if (!res.ok) throw new Error(`eth_call ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message ?? 'eth_call error');
    return BigInt(json.result || '0x0');
};

/**
 * Стейкинг ETH по адресу. Возвращает массив в форме Blockbook `stakingPools`
 * (0 или 1 пул) — пустой, если стейка нет, чтобы в UI не мелькал нулевой чип.
 */
export const readEverstakeStaking = async (address: string, rpcUrl: string): Promise<EthStakingPool[]> => {
    const [autocompound, pending, pendingDeposited] = await Promise.all([
        ethCall(rpcUrl, SELECTORS.autocompound, address),
        ethCall(rpcUrl, SELECTORS.pending, address),
        ethCall(rpcUrl, SELECTORS.pendingDeposited, address)
    ]);
    const zero = BigInt(0);
    if (autocompound === zero && pending === zero && pendingDeposited === zero) return [];
    return [
        {
            autocompoundBalance: autocompound.toString(),
            pendingBalance: pending.toString(),
            pendingDepositedBalance: pendingDeposited.toString()
        }
    ];
};
