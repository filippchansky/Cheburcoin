export interface ISharesChart {
    candles: Candles;
}

export interface Candles {
    columns: string[];
    data: [number, number, number, number, number, number, string, string][];
}
