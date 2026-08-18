/**
 * Сборка крипто-холдингов в позиции портфеля (IPosition), чтобы крипта легла в
 * тот же дашборд, что и бумаги Т-Банка.
 *
 * Решения (согласовано):
 *  • Стоимость в ₽: amount × цена(USD, CoinStats) × курс ЦБ USD/RUB. Поэтому
 *    currency='RUB' — «Цена»/«В портфеле» рисуются в рублях, как остальной портфель.
 *  • «Прибыль» НЕ считаем: кошелёк не знает себестоимость → expectedYieldFifo=0,
 *    а таблица для типа 'crypto' покажет прочерк (Этап 4).
 *  • «За день» есть: priceInPorfolio × изменение цены за сутки, %.
 *  • quantity = число монет (может быть дробным — таблица это переваривает).
 */
import { IPosition } from '@models/tinkoffData';
import { CryptoBalance } from './balances';
import { trezorCoinByKey } from './coins';

export interface CryptoPriceInfo {
    /** Цена одной монеты в рублях. */
    priceRub: number;
    /** Изменение цены за сутки, % (из CoinStats priceChange1d). */
    changePct1d: number;
}

/** Собирает позиции из балансов и цен. Нулевые/битые балансы отсекаются. */
export const cryptoToPositions = (
    balances: CryptoBalance[],
    prices: Record<string, CryptoPriceInfo>
): IPosition[] =>
    balances
        .filter((b) => b.amount > 0)
        .map((b) => {
            const config = trezorCoinByKey(b.coin);
            const price = prices[b.coin];
            const priceRub = price?.priceRub ?? 0;
            const value = priceRub * b.amount;
            const dayAbs = (value * (price?.changePct1d ?? 0)) / 100;

            const position: IPosition = {
                figi: '',
                instrumentType: 'crypto',
                quantity: b.amount,
                averagePositionPrice: 0,
                expectedYield: 0,
                averagePositionPricePt: 0,
                currentPrice: priceRub,
                averagePositionPriceFifo: 0,
                quantityLots: b.amount,
                blocked: false,
                blockedLots: 0,
                // Уникальный ключ строки/мерджа — монета одна на кошелёк.
                positionUid: `trezor:${b.coin}`,
                instrumentUid: `trezor:${b.coin}`,
                varMargin: 0,
                // Нет себестоимости → курсовую прибыль не знаем.
                expectedYieldFifo: 0,
                dailyYield: Number(dayAbs.toFixed(2)),
                ticker: b.coin,
                name: config?.name ?? b.coin,
                sector: undefined,
                isin: undefined,
                priceInPorfolio: Number(value.toFixed(2)),
                expectedYieldPercent: 0,
                currency: 'RUB'
            };
            return position;
        });
