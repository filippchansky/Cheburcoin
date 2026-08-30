import { IPosition } from '@models/tinkoffData';
import { trezorCoinByKey } from '@/lib/trezor/coins';

/** Куда ведёт клик по позиции портфеля (акции/фонды, облигации и крипта). */
export const positionHref = (position: IPosition): string | null => {
    if (position.instrumentType === 'crypto') {
        // Тикер позиции (BTC/ETH/SOL) → id монеты в CoinGecko → страница монеты.
        const coingeckoId = trezorCoinByKey(position.ticker ?? '')?.coingeckoId;
        return coingeckoId ? `/cryptocurrency/${coingeckoId}` : null;
    }
    if (!position.ticker) return null;
    if (position.instrumentType === 'bond') return `/bonds/${position.ticker}`;
    if (position.instrumentType === 'share' || position.instrumentType === 'etf') {
        return `/moex/${position.ticker}`;
    }
    return null;
};
