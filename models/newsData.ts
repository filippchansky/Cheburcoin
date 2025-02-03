export type INews = INewsData[];

export interface INewsData {
    id: string;
    searchKeyWords: string[];
    feedDate: number;
    source: string;
    title: string;
    sourceLink: string;
    isFeatured: boolean;
    imgUrl: string;
    reactionsCount: ReactionsCount;
    reactions: any[];
    shareURL: string;
    relatedCoins: string[];
    content: boolean;
    link: string;
    bigImg: boolean;
    description: string;
    coins: ICoin[];
}

export interface ReactionsCount {
    '2'?: number;
}

export interface ICoin {
    coinKeyWords: string;
    coinPercent: number;
    coinTitleKeyWords: string;
    coinNameKeyWords: string;
    coinIdKeyWords: string;
}
