/**
 * Подключённый крипто-счёт Trezor, как он лежит в Firestore (`users/{uid}.trezorAccounts`).
 *
 * Храним ТОЛЬКО публичный дескриптор — приватные ключи остаются на устройстве.
 * По дескриптору баланс опрашивается без устройства (см. lib/trezor). Дескриптор
 * read-only: позволяет видеть баланс/историю, но НЕ тратить.
 */
export interface ITrezorAccount {
    /** Ключ монеты из lib/trezor/coins (BTC | ETH | SOL). */
    coin: string;
    /** Публичный дескриптор: xpub (BTC), адрес (ETH), base58-адрес (SOL). */
    descriptor: string;
    /** Метка для UI (имя монеты; при желании — пользовательская). */
    label: string;
}
