/**
 * Подпись приватных запросов Bybit API v5 (HMAC-SHA256).
 *
 * Правило v5: preSign = timestamp + apiKey + recvWindow + payload, где payload —
 * это queryString для GET (в ТОМ ЖЕ порядке, что и в URL) или тело JSON для POST.
 * Подпись кладётся в заголовок X-BAPI-SIGN. Считается ТОЛЬКО на сервере — secret
 * в браузер не уходит (см. api/bybit/route.ts).
 */
import crypto from 'crypto';

/**
 * Строка запроса в фиксированном порядке вставки ключей — одна и та же для URL и
 * для подписи (Bybit сверяет их посимвольно, поэтому важно не пересортировать).
 * Пустые/undefined-значения отбрасываем.
 */
export const toQueryString = (
    params: Record<string, string | number | undefined>
): string =>
    Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${k}=${v}`)
        .join('&');

/**
 * HMAC-SHA256 подпись для приватного запроса. payload — queryString (GET) или тело
 * (POST). Возвращает hex.
 */
export const signPayload = (
    apiSecret: string,
    apiKey: string,
    timestamp: string,
    recvWindow: string,
    payload: string
): string =>
    crypto
        .createHmac('sha256', apiSecret)
        .update(timestamp + apiKey + recvWindow + payload)
        .digest('hex');
