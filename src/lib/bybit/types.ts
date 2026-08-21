/**
 * Общие типы Bybit — без серверных зависимостей (Node crypto живёт в client.ts).
 * Вынесены отдельно, чтобы браузерные модули (toPositions, хуки) могли
 * импортировать типы, не притягивая серверный код в клиентский бандл.
 */

/** Пара ключей Bybit (read-only). Приходит из запроса пользователя (Firestore). */
export interface BybitCreds {
    apiKey: string;
    apiSecret: string;
}

/** Нормализованный баланс одной монеты на аккаунте Bybit. */
export interface BybitCoinBalance {
    coin: string;
    /** Кол-во монет (walletBalance). */
    qty: number;
    /** Оценка позиции в USD (usdValue от Bybit). */
    usdValue: number;
}
