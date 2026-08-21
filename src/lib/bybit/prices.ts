/**
 * Курс USD→RUB для перевода оценок Bybit (биржа отдаёт usdValue по каждой монете)
 * в рубли — основную валюту агрегатов портфеля.
 *
 * Берём цену USDT (tether) в ₽ на CoinGecko: один публичный запрос без ключа, с
 * CORS (тот же приём, что в lib/trezor/prices.ts). USDT ≈ USD — для оценки
 * портфеля точности достаточно.
 */
const COINGECKO = process.env.NEXT_PUBLIC_COINGECKO_API || 'https://api.coingecko.com/api/v3';

export const fetchUsdRub = async (): Promise<number> => {
    const url = `${COINGECKO}/simple/price?ids=tether&vs_currencies=rub`;
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const json = (await res.json()) as { tether?: { rub?: number } };
    const rate = json.tether?.rub;
    if (!rate) throw new Error('USD/RUB rate missing');
    return rate;
};
