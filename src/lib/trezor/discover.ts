/**
 * Подключение устройства Trezor: снимаем публичные дескрипторы по выбранным
 * монетам. Это ЕДИНСТВЕННЫЙ шаг, где устройство обязательно присутствует
 * (пользователь подтверждает экспорт на экране Trezor). Дальше баланс тянется
 * без устройства по сохранённому дескриптору (см. будущий Этап 2).
 *
 * Разные сети — разные методы (адаптеры из coins.ts):
 *  • blockbook (BTC/ETH) → getAccountInfo({ coin, path }) отдаёт descriptor.
 *  • solana (SOL)        → solanaGetAddress({ path }) отдаёт address.
 *
 * Монеты обходим ПОСЛЕДОВАТЕЛЬНО: каждый метод может требовать подтверждения на
 * устройстве, параллельный вызов их бы конфликтовал. Ошибку по одной монете не
 * роняем на всю операцию — возвращаем успешные + список неудавшихся.
 */
import { ITrezorAccount } from '@models/trezor';
import { getTrezorConnect } from './connect';
import { TREZOR_COINS, TrezorCoinConfig } from './coins';

export interface TrezorCoinError {
    coin: string;
    error: string;
}

export interface ConnectTrezorResult {
    accounts: ITrezorAccount[];
    /** Монеты, по которым получить дескриптор не удалось, с текстом ошибки. */
    failed: TrezorCoinError[];
    /** true — пользователь отменил операцию на устройстве/в попапе. */
    cancelled: boolean;
}

/** Код отмены из Trezor Connect (пользователь закрыл попап / нажал Cancel). */
const isCancel = (code?: string): boolean =>
    code === 'Method_Cancel' || code === 'Method_Interrupted' || code === 'Popup_Closed';

/** Прокидывает code ошибки Trezor в брошенную Error. */
const fail = (payload: { error: string; code?: string }): never => {
    const err = new Error(payload.error);
    (err as Error & { code?: string }).code = payload.code;
    throw err;
};

/**
 * Снимает дескриптор одной монеты. Используем ТОЛЬКО device-only методы (без
 * обращения к backend) — они не зависят от Blockbook и не могут зависнуть на
 * транспорте: раньше getAccountInfo по btc падал именно из-за backend-шага.
 *  • utxo (BTC) → getPublicKey → xpubSegwit (zpub для BIP84) — его понимает Blockbook.
 *  • evm  (ETH) → ethereumGetAddress → адрес.
 *  • solana     → solanaGetAddress → адрес.
 */
const fetchDescriptor = async (coin: TrezorCoinConfig): Promise<string> => {
    const TrezorConnect = await getTrezorConnect();

    if (coin.adapter === 'solana') {
        const res = await TrezorConnect.solanaGetAddress({ path: coin.path });
        return res.success ? res.payload.address : fail(res.payload);
    }

    if (coin.adapter === 'evm') {
        const res = await TrezorConnect.ethereumGetAddress({ path: coin.path });
        return res.success ? res.payload.address : fail(res.payload);
    }

    // utxo (BTC): xpubSegwit — дескриптор, который принимает Blockbook (zpub).
    // scriptType SPENDWITNESS = BIP84 (native segwit, bc1) — соответствует path m/84'.
    const res = await TrezorConnect.getPublicKey({
        path: coin.path,
        coin: coin.trezorCoin,
        scriptType: 'SPENDWITNESS'
    });
    if (!res.success) return fail(res.payload);
    return res.payload.xpubSegwit ?? res.payload.xpub;
};

/**
 * Подключает выбранные монеты и возвращает их дескрипторы для сохранения.
 * @param coinKeys ключи монет (BTC/ETH/SOL) из TREZOR_COINS.
 */
export const connectTrezor = async (coinKeys: string[]): Promise<ConnectTrezorResult> => {
    const coins = TREZOR_COINS.filter((coin) => coinKeys.includes(coin.key));
    const accounts: ITrezorAccount[] = [];
    const failed: TrezorCoinError[] = [];

    for (const coin of coins) {
        try {
            const descriptor = await fetchDescriptor(coin);
            accounts.push({ coin: coin.key, descriptor, label: coin.name });
        } catch (error) {
            const code = (error as Error & { code?: string }).code;
            // Отмену трактуем как «прервать всё» — незачем дёргать устройство
            // дальше, если пользователь закрыл попап.
            if (isCancel(code)) {
                return { accounts, failed, cancelled: true };
            }
            failed.push({
                coin: coin.key,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    return { accounts, failed, cancelled: false };
};
