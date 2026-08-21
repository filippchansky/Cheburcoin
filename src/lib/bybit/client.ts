/**
 * Тонкий серверный клиент Bybit API v5 (только чтение).
 *
 * Зачем сервер, а не fetch из браузера: приватка Bybit требует подписи с secret'ом
 * (в браузер его выносить нельзя) + гео/IP-ограничения биржи проще пройти с
 * серверного IP (см. bybit-integration-plan, Этап 0). Ключ создаётся read-only,
 * без прав Trade/Withdraw — даже утечка не даёт вывести средства.
 */
import { signPayload, toQueryString } from './sign';
import { BybitCreds, BybitCoinBalance } from './types';

export type { BybitCreds, BybitCoinBalance } from './types';

const BASE = process.env.BYBIT_API_BASE || 'https://api.bybit.com';
const RECV_WINDOW = process.env.BYBIT_RECV_WINDOW || '5000';

/** Ошибка Bybit (HTTP-сбой или ненулевой retCode). retCode — код из ответа v5. */
export class BybitError extends Error {
    constructor(
        message: string,
        readonly retCode?: number
    ) {
        super(message);
        this.name = 'BybitError';
    }
}

/**
 * Ключи запроса: пер-юзер (из тела прокси, основной путь) или, если не переданы,
 * серверный fallback из env — удобно гонять «под себя» при отладке.
 */
const resolveCreds = (creds?: Partial<BybitCreds>): BybitCreds => {
    const apiKey = creds?.apiKey || process.env.BYBIT_API_KEY;
    const apiSecret = creds?.apiSecret || process.env.BYBIT_API_SECRET;
    if (!apiKey || !apiSecret) {
        throw new BybitError('Не заданы ключи Bybit (apiKey/apiSecret)');
    }
    return { apiKey, apiSecret };
};

interface BybitEnvelope<T> {
    retCode: number;
    retMsg: string;
    result: T;
}

/** Приватный GET к Bybit v5 с подписью. Бросает BybitError при HTTP-сбое или retCode != 0. */
const privateGet = async <T>(
    path: string,
    params: Record<string, string | number | undefined> = {},
    creds?: Partial<BybitCreds>
): Promise<T> => {
    const { apiKey, apiSecret } = resolveCreds(creds);
    const timestamp = Date.now().toString();
    const query = toQueryString(params);
    const sign = signPayload(apiSecret, apiKey, timestamp, RECV_WINDOW, query);

    const url = query ? `${BASE}${path}?${query}` : `${BASE}${path}`;
    const res = await fetch(url, {
        headers: {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': RECV_WINDOW,
            'X-BAPI-SIGN': sign,
            accept: 'application/json'
        },
        cache: 'no-store'
    });
    if (!res.ok) throw new BybitError(`Bybit HTTP ${res.status}`);

    const json = (await res.json()) as BybitEnvelope<T>;
    if (json.retCode !== 0) {
        throw new BybitError(json.retMsg || 'Bybit error', json.retCode);
    }
    return json.result;
};

interface WalletBalanceResult {
    list: Array<{
        accountType: string;
        totalEquity: string;
        coin: Array<{ coin: string; walletBalance: string; usdValue: string }>;
    }>;
}

/**
 * Балансы UNIFIED-аккаунта: только ненулевые монеты, приведённые к числам.
 * usdValue отдаёт сам Bybit — в ₽ переводим уже на фронте общим курсом (Этап 2).
 */
export const getWalletBalance = async (
    creds?: Partial<BybitCreds>
): Promise<BybitCoinBalance[]> => {
    const result = await privateGet<WalletBalanceResult>(
        '/v5/account/wallet-balance',
        { accountType: 'UNIFIED' },
        creds
    );
    const account = result.list?.[0];
    if (!account?.coin) return [];

    return account.coin
        .map((c) => ({
            coin: c.coin,
            qty: Number(c.walletBalance) || 0,
            usdValue: Number(c.usdValue) || 0
        }))
        .filter((c) => c.qty > 0);
};
