/**
 * Балансы Bybit → позиции портфеля (IPosition), чтобы крипта с биржи легла в тот
 * же дашборд, что и бумаги Т-Банка и крипта Trezor.
 *
 * Решения (согласовано, зеркалим lib/trezor/toPositions):
 *  • Стоимость в ₽: Bybit сам оценивает каждую монету в USD (usdValue) → умножаем
 *    на курс USD→RUB (USDT/₽). Поэтому currency='RUB'.
 *  • usd-блок: цена/стоимость в $ прямо из данных Bybit (двухвалютное отображение).
 *  • «Прибыль»: Bybit НЕ отдаёт себестоимость по споту (в отличие от Т-Банка) и
 *    считать её из истории сделок ненадёжно (глубина + заведённые извне монеты).
 *    Поэтому средняя цену покупки вводит пользователь ВРУЧНУЮ, в USD (монета
 *    котируется к USDT). Есть средняя по монете → считаем прибыль; нет → 0 (прочерк).
 *  • «За день»: стоимость в ₽ × 24h-изменение цены (из public tickers Bybit).
 *  • positionUid = `bybit:<coin>` — отдельные строки от Trezor (разное хранение).
 */
import { IPosition } from '@models/tinkoffData';
import { BybitCoinBalance } from './types';
import { MIN_DISPLAY_USD } from '@/lib/portfolio/cryptoLots';

/** Ручные средние цены покупки по монетам, в USD (тикер → цена за 1 монету). */
export type BybitAvgPrices = Record<string, number>;

export const bybitToPositions = (
    balances: BybitCoinBalance[],
    usdRub: number,
    avgPrices: BybitAvgPrices = {}
): IPosition[] =>
    balances
        // Прячем пыль дешевле доллара (мелкие остатки на бирже).
        .filter((b) => b.qty > 0 && b.usdValue >= MIN_DISPLAY_USD)
        .map((b) => {
            const valueRub = b.usdValue * usdRub;
            const priceUsd = b.qty ? b.usdValue / b.qty : 0;
            const priceRub = priceUsd * usdRub;

            // Ручная средняя (USD). Если задана и валидна — считаем прибыль в ₽,
            // всё в рублях, чтобы согласовалось с колонкой «Прибыль» портфеля.
            const avgUsd = avgPrices[b.coin] > 0 ? avgPrices[b.coin] : 0;
            const avgRub = avgUsd * usdRub;
            const profitRub = avgUsd ? (priceUsd - avgUsd) * b.qty * usdRub : 0;
            const profitPct = avgUsd ? ((priceUsd - avgUsd) / avgUsd) * 100 : 0;

            // За день, ₽: текущая стоимость × суточное изменение цены.
            const dayRub = (valueRub * b.change24hPct) / 100;

            const position: IPosition = {
                figi: '',
                instrumentType: 'crypto',
                quantity: b.qty,
                averagePositionPrice: Number(avgRub.toFixed(2)),
                expectedYield: 0,
                averagePositionPricePt: 0,
                currentPrice: Number(priceRub.toFixed(2)),
                averagePositionPriceFifo: Number(avgRub.toFixed(2)),
                quantityLots: b.qty,
                blocked: false,
                blockedLots: 0,
                positionUid: `bybit:${b.coin}`,
                instrumentUid: `bybit:${b.coin}`,
                varMargin: 0,
                expectedYieldFifo: Number(profitRub.toFixed(2)),
                dailyYield: Number(dayRub.toFixed(2)),
                ticker: b.coin,
                name: b.coin,
                sector: undefined,
                isin: undefined,
                priceInPorfolio: Number(valueRub.toFixed(2)),
                expectedYieldPercent: Number(profitPct.toFixed(2)),
                currency: 'RUB',
                usd: { price: priceUsd, value: Number(b.usdValue.toFixed(2)) }
            };
            return position;
        });
