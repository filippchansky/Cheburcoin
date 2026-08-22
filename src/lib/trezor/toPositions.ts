/**
 * Сборка крипто-холдингов в позиции портфеля (IPosition), чтобы крипта легла в
 * тот же дашборд, что и бумаги Т-Банка.
 *
 * Решения (согласовано):
 *  • Стоимость в ₽: amount × цена в ₽ (CoinGecko, simple/price vs_currency=rub).
 *    Поэтому currency='RUB' — «Цена»/«В портфеле» рисуются в рублях, как остальной портфель.
 *  • «Прибыль»: кошелёк не знает себестоимость → берём её из ручных покупок
 *    пользователя (avgPrices, USD; единые по монете с Bybit). Есть средняя →
 *    считаем; нет → 0 (прочерк).
 *  • «За день» есть: priceInPorfolio × изменение цены за сутки, %.
 *  • quantity = число монет (может быть дробным — таблица это переваривает).
 */
import { IPosition } from '@models/tinkoffData';
import { CryptoBalance } from './balances';
import { trezorCoinByKey } from './coins';
import { MIN_DISPLAY_USD } from '@/lib/portfolio/cryptoLots';

export interface CryptoPriceInfo {
    /** Цена одной монеты в рублях. */
    priceRub: number;
    /** Цена одной монеты в долларах (для двухвалютного отображения). */
    priceUsd: number;
    /** Изменение цены за сутки, % (CoinGecko rub_24h_change). */
    changePct1d: number;
}

/** Собирает позиции из балансов и цен. Нулевые/битые/пылевые балансы отсекаются. */
export const cryptoToPositions = (
    balances: CryptoBalance[],
    prices: Record<string, CryptoPriceInfo>,
    /** Ручные средние цены покупки по монетам, USD (единые с Bybit). */
    avgPrices: Record<string, number> = {}
): IPosition[] =>
    balances
        .map((b) => {
            const config = trezorCoinByKey(b.coin);
            const price = prices[b.coin];
            const priceRub = price?.priceRub ?? 0;
            const priceUsd = price?.priceUsd ?? 0;
            const value = priceRub * b.amount;
            const usdValue = priceUsd * b.amount;
            const dayAbs = (value * (price?.changePct1d ?? 0)) / 100;

            // Себестоимость из ручной средней (USD → ₽ через тот же курс, что и цена).
            const avgUsd = avgPrices[b.coin] > 0 ? avgPrices[b.coin] : 0;
            const rate = priceUsd > 0 ? priceRub / priceUsd : 0; // ≈ USD/RUB
            const avgRub = avgUsd * rate;
            const profitRub = avgUsd ? (priceRub - avgRub) * b.amount : 0;
            const profitPct = avgUsd ? ((priceUsd - avgUsd) / avgUsd) * 100 : 0;

            return { b, config, price, priceRub, priceUsd, value, usdValue, dayAbs, avgRub, profitRub, profitPct };
        })
        // Прячем нулевые и пыль дешевле доллара.
        .filter((x) => x.b.amount > 0 && x.usdValue >= MIN_DISPLAY_USD)
        .map((x) => {
            const { b, config, price, priceRub, priceUsd, value, dayAbs, avgRub, profitRub, profitPct } = x;
            const position: IPosition = {
                figi: '',
                instrumentType: 'crypto',
                quantity: b.amount,
                averagePositionPrice: Number(avgRub.toFixed(2)),
                expectedYield: 0,
                averagePositionPricePt: 0,
                currentPrice: priceRub,
                averagePositionPriceFifo: Number(avgRub.toFixed(2)),
                quantityLots: b.amount,
                blocked: false,
                blockedLots: 0,
                // Уникальный ключ строки/мерджа — монета одна на кошелёк.
                positionUid: `trezor:${b.coin}`,
                instrumentUid: `trezor:${b.coin}`,
                varMargin: 0,
                // Прибыль по ручной средней (0, если средняя не задана → прочерк).
                expectedYieldFifo: Number(profitRub.toFixed(2)),
                dailyYield: Number(dayAbs.toFixed(2)),
                ticker: b.coin,
                name: config?.name ?? b.coin,
                sector: undefined,
                isin: undefined,
                priceInPorfolio: Number(value.toFixed(2)),
                expectedYieldPercent: Number(profitPct.toFixed(2)),
                currency: 'RUB',
                // Пометка «в стейкинге»: показываем, только если что-то застейкано.
                stakedQuantity: b.staked > 0 ? b.staked : undefined,
                // Двухвалютное отображение крипты: $ основной, ₽ снизу.
                usd: { price: priceUsd, value: Number((priceUsd * b.amount).toFixed(2)) },
                // Локальная иконка монеты (у крипты нет ISIN для лого по бумагам).
                logoUrl: config?.icon
            };
            return position;
        });
