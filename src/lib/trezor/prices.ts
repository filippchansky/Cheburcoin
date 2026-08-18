/**
 * Цены крипты в рублях — ОДИН запрос к CoinGecko на все монеты сразу.
 *
 * Почему не CoinStats: платный ключ упирается в лимит запросов (429) и цену
 * отдаёт в USD (нужен ещё курс). CoinGecko simple/price отдаёт сразу цену в ₽
 * и изменение за сутки, без ключа, с CORS, одним вызовом — проще и без лимита.
 * Почему не курсы самого Trezor (blockchainGetCurrentFiatRates): они не покрывают
 * Solana (её нет в Blockbook) и не дают суточное изменение.
 */
import { CryptoPriceInfo } from './toPositions';
import { trezorCoinByKey } from './coins';

const COINGECKO = process.env.NEXT_PUBLIC_COINGECKO_API || 'https://api.coingecko.com/api/v3';

interface CoinGeckoPrice {
    rub?: number;
    rub_24h_change?: number;
    usd?: number;
}

/**
 * Цены по ключам монет (BTC/ETH/SOL): ₽ (основная валюта агрегатов) + $ (для
 * двухвалютного отображения крипты). Оба — одним запросом. Пустой ответ по монете
 * → её пропустят.
 */
export const fetchCryptoPricesRub = async (
    coinKeys: string[]
): Promise<Record<string, CryptoPriceInfo>> => {
    const ids = coinKeys
        .map((key) => trezorCoinByKey(key)?.coingeckoId)
        .filter((id): id is string => Boolean(id));
    if (!ids.length) return {};

    const url = `${COINGECKO}/simple/price?ids=${ids.join(',')}&vs_currencies=rub,usd&include_24hr_change=true`;
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const json = (await res.json()) as Record<string, CoinGeckoPrice>;

    const result: Record<string, CryptoPriceInfo> = {};
    coinKeys.forEach((key) => {
        const id = trezorCoinByKey(key)?.coingeckoId;
        const row = id ? json[id] : undefined;
        if (row?.rub != null) {
            result[key] = {
                priceRub: row.rub,
                priceUsd: row.usd ?? 0,
                changePct1d: row.rub_24h_change ?? 0
            };
        }
    });
    return result;
};
