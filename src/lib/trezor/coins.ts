/**
 * Курируемый список поддерживаемых сетей (MVP: BTC, ETH, Solana).
 *
 * Устройство и Trezor Connect больше не нужны: дескриптор (xpub/адрес) вводится
 * вручную (см. TrezorConnectCard), а баланс читается публичными сервисами.
 *
 * Адаптер = как читаем баланс по дескриптору:
 *  • utxo (BTC)   → Blockbook REST `/api/v2/xpub/{xpub}` через наш /api/blockbook.
 *  • evm  (ETH)   → Blockbook REST `/api/v2/address/{addr}` через /api/blockbook
 *                   (даёт ликвид + стейкинг Everstake; обычный RPC стейкинг не видит).
 *  • solana (SOL) → JSON-RPC `getBalance(address)` напрямую (CORS-friendly нода).
 *
 * `coingeckoId` — цена в ₽ (CoinGecko). `currency` — код в currencyRegistry.
 */

export type TrezorAdapter = 'utxo' | 'evm' | 'solana';

export interface TrezorCoinConfig {
    /** Внутренний ключ монеты (совпадает с currency в реестре). */
    key: string;
    /** Как читаем баланс. */
    adapter: TrezorAdapter;
    /** Код валюты в currencyRegistry (для formatAmount). */
    currency: string;
    /** id монеты в CoinGecko (для цены в ₽ одним запросом). */
    coingeckoId: string;
    /** Человекочитаемое имя. */
    name: string;
    /** Кол-во знаков в базовой единице → монеты (BTC 8, ETH 18, SOL 9). */
    decimals: number;
    /** JSON-RPC эндпоинт (только solana — evm/utxo идут через /api/blockbook). */
    rpcUrl?: string;
}

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://solana-rpc.publicnode.com';

export const TREZOR_COINS: TrezorCoinConfig[] = [
    {
        key: 'BTC',
        adapter: 'utxo',
        currency: 'BTC',
        coingeckoId: 'bitcoin',
        name: 'Bitcoin',
        decimals: 8
    },
    {
        key: 'ETH',
        adapter: 'evm',
        currency: 'ETH',
        coingeckoId: 'ethereum',
        name: 'Ethereum',
        decimals: 18
    },
    {
        key: 'SOL',
        adapter: 'solana',
        currency: 'SOL',
        coingeckoId: 'solana',
        name: 'Solana',
        decimals: 9,
        rpcUrl: SOLANA_RPC
    }
];

/** Конфиг монеты по её ключу (BTC/ETH/SOL). */
export const trezorCoinByKey = (key: string): TrezorCoinConfig | undefined =>
    TREZOR_COINS.find((coin) => coin.key === key);

/** Конфиг монеты по её id в CoinGecko (bitcoin/ethereum/solana) — для страницы монеты. */
export const trezorCoinByCoingeckoId = (id: string): TrezorCoinConfig | undefined =>
    TREZOR_COINS.find((coin) => coin.coingeckoId === id);
