/**
 * Проверка формы дескрипторов, введённых вручную. Полную проверку контрольной
 * суммы (base58check/keccak) не делаем — это лишний вес; достаточно отсечь явные
 * опечатки. Настоящую валидацию даст первый запрос баланса.
 */
import { TrezorAdapter } from './coins';

// base58-алфавит биткойна (без 0 O I l).
const BASE58 = '[1-9A-HJ-NP-Za-km-z]';

/** Возвращает текст ошибки или null, если дескриптор выглядит валидным. */
export const validateDescriptor = (adapter: TrezorAdapter, raw: string): string | null => {
    const d = raw.trim();
    if (!d) return 'Пустой дескриптор';

    if (adapter === 'utxo') {
        // BTC: extended public key — xpub (legacy) / ypub (p2sh-segwit) / zpub (native segwit).
        if (!new RegExp(`^(x|y|z)pub${BASE58}{50,120}$`).test(d)) {
            return 'Ожидается xpub / ypub / zpub из Trezor Suite';
        }
        return null;
    }
    if (adapter === 'evm') {
        // ETH: 0x + 40 hex.
        if (!/^0x[0-9a-fA-F]{40}$/.test(d)) return 'Ожидается ETH-адрес вида 0x…';
        return null;
    }
    // solana: base58, 32–44 символа.
    if (!new RegExp(`^${BASE58}{32,44}$`).test(d)) return 'Ожидается SOL-адрес (base58)';
    return null;
};
