export interface IAccount {
    id: string;
    name: string;
}

export interface IPortfolio {
    totalAmountShares: number;
    totalAmountBonds: number;
    totalAmountEtf: number;
    totalAmountCurrencies: number;
    totalAmountFutures: number;
    expectedYield: number;
    positions: IPosition[];
    accountId: string;
    totalAmountOptions: number;
    totalAmountSp: number;
    totalAmountPortfolio: number;
    virtualPositions: any[];
    dailyYield: number;
    dailyYieldRelative: number;
    name: string;
    expectedYieldInt: number;
}

export interface IPosition {
    figi: string;
    instrumentType: string;
    quantity: number;
    averagePositionPrice: number;
    expectedYield: number;
    averagePositionPricePt: number;
    currentPrice: number;
    averagePositionPriceFifo: number;
    quantityLots: number;
    blocked: boolean;
    blockedLots: number;
    positionUid: string;
    instrumentUid: string;
    varMargin: number;
    expectedYieldFifo: number;
    dailyYield: number;
    ticker?: string;
    name?: string;
    sector?: string;
    isin?: string;
    priceInPorfolio: number
    expectedYieldPercent: number
}
