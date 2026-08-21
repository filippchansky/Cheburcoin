/**
 * Балансы Bybit → позиции портфеля (IPosition), чтобы крипта с биржи легла в тот
 * же дашборд, что и бумаги Т-Банка и крипта Trezor.
 *
 * Решения (согласовано, зеркалим lib/trezor/toPositions):
 *  • Стоимость в ₽: Bybit сам оценивает каждую монету в USD (usdValue) → умножаем
 *    на курс USD→RUB (USDT/₽). Поэтому currency='RUB'.
 *  • usd-блок: цена/стоимость в $ прямо из данных Bybit (двухвалютное отображение).
 *  • «Прибыль» НЕ считаем: биржевой баланс не знает себестоимость → expectedYieldFifo=0
 *    (таблица покажет прочерк, как у крипты Trezor).
 *  • «За день» пока 0: 24h-изменение по монете тянуть отдельно (Bybit public
 *    tickers) — вынесено в follow-up, чтобы не раздувать Этап 2.
 *  • positionUid = `bybit:<coin>` — отдельные строки от Trezor (разное хранение).
 */
import { IPosition } from '@models/tinkoffData';
import { BybitCoinBalance } from './types';

export const bybitToPositions = (
    balances: BybitCoinBalance[],
    usdRub: number
): IPosition[] =>
    balances
        .filter((b) => b.qty > 0)
        .map((b) => {
            const valueRub = b.usdValue * usdRub;
            const priceUsd = b.qty ? b.usdValue / b.qty : 0;
            const priceRub = priceUsd * usdRub;

            const position: IPosition = {
                figi: '',
                instrumentType: 'crypto',
                quantity: b.qty,
                averagePositionPrice: 0,
                expectedYield: 0,
                averagePositionPricePt: 0,
                currentPrice: Number(priceRub.toFixed(2)),
                averagePositionPriceFifo: 0,
                quantityLots: b.qty,
                blocked: false,
                blockedLots: 0,
                positionUid: `bybit:${b.coin}`,
                instrumentUid: `bybit:${b.coin}`,
                varMargin: 0,
                expectedYieldFifo: 0,
                dailyYield: 0,
                ticker: b.coin,
                name: b.coin,
                sector: undefined,
                isin: undefined,
                priceInPorfolio: Number(valueRub.toFixed(2)),
                expectedYieldPercent: 0,
                currency: 'RUB',
                usd: { price: priceUsd, value: Number(b.usdValue.toFixed(2)) }
            };
            return position;
        });
