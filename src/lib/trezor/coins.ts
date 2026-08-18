/**
 * Курируемый список поддерживаемых сетей Trezor (MVP: BTC, ETH, Solana).
 *
 * ВАЖНО: баланс читаем НАПРЯМУЮ (публичные RPC/Blockbook), НЕ через Trezor
 * Connect. Причина: getAccountInfo даже с дескриптором тащит за собой локальный
 * транспорт устройства (Bridge/WebUSB на 127.0.0.1:2132x) и висит без него.
 * Trezor Connect нужен ТОЛЬКО при первом подключении — снять дескриптор.
 *
 * Адаптер = как читаем баланс по дескриптору:
 *  • utxo (BTC)   → Blockbook REST `/api/v2/xpub/{xpub}` (descriptor = xpub).
 *  • evm  (ETH)   → JSON-RPC `eth_getBalance(address)` (descriptor = адрес).
 *  • solana (SOL) → JSON-RPC `getBalance(address)` (descriptor = base58-адрес).
 *
 * `coingeckoId` — цена в ₽ (CoinGecko). `currency` — код в currencyRegistry.
 * `trezorCoin`/`path` используются только на подключении (см. discover.ts).
 */

export type TrezorAdapter = 'utxo' | 'evm' | 'solana';

export interface TrezorCoinConfig {
    /** Внутренний ключ монеты (совпадает с currency в реестре). */
    key: string;
    /** Как читаем баланс. */
    adapter: TrezorAdapter;
    /** Код `coin` для методов Trezor Connect (только на подключении). */
    trezorCoin: string;
    /** Стандартный путь деривации для первого счёта (только на подключении). */
    path: string;
    /** Код валюты в currencyRegistry (для formatAmount). */
    currency: string;
    /** id монеты в CoinGecko (для цены в ₽ одним запросом). */
    coingeckoId: string;
    /** Человекочитаемое имя. */
    name: string;
    /** Кол-во знаков в базовой единице → монеты (BTC 8, ETH 18, SOL 9). */
    decimals: number;
    /** JSON-RPC эндпоинт для evm/solana. */
    rpcUrl?: string;
    /** База Blockbook REST для utxo (BTC). */
    blockbookUrl?: string;
}

const ETH_RPC = process.env.NEXT_PUBLIC_ETH_RPC || 'https://ethereum-rpc.publicnode.com';
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://solana-rpc.publicnode.com';
const BTC_BLOCKBOOK = process.env.NEXT_PUBLIC_BTC_BLOCKBOOK || 'https://btc1.trezor.io';

export const TREZOR_COINS: TrezorCoinConfig[] = [
    {
        key: 'BTC',
        adapter: 'utxo',
        trezorCoin: 'btc',
        // Native SegWit, уровень счёта → Trezor вернёт xpub как descriptor.
        path: "m/84'/0'/0'",
        currency: 'BTC',
        coingeckoId: 'bitcoin',
        name: 'Bitcoin',
        decimals: 8,
        blockbookUrl: BTC_BLOCKBOOK
    },
    {
        key: 'ETH',
        adapter: 'evm',
        trezorCoin: 'eth',
        path: "m/44'/60'/0'/0/0",
        currency: 'ETH',
        coingeckoId: 'ethereum',
        name: 'Ethereum',
        decimals: 18,
        rpcUrl: ETH_RPC
    },
    {
        key: 'SOL',
        adapter: 'solana',
        trezorCoin: 'sol',
        path: "m/44'/501'/0'/0'",
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
