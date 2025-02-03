export interface ICoinData {
    result: ICoin[];
    meta: ICoinMeta;
}

export interface ICoin {
    id: string;
    icon: string;
    name: string;
    symbol: string;
    rank: number;
    price: number;
    priceBtc: number;
    volume: number;
    marketCap: number;
    availableSupply: number;
    totalSupply: number;
    priceChange1h: number;
    priceChange1d: number;
    priceChange1w: number;
    redditUrl: string;
    websiteUrl: string;
    twitterUrl?: string;
    explorers: string[];
    contractAddress?: string;
    decimals?: number;
}

export interface ICoinMeta {
    page: number;
    limit: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}
