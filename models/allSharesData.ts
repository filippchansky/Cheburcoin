export interface IShares {
    securities: Securities
    marketdata: Marketdata
    dataversion: Dataversion
    marketdata_yields: MarketdataYields
  }
  
  export interface Securities {
    columns: string[]
    data: any[][]
  }
  
  export interface Marketdata {
    columns: string[]
    data: any[][]
  }
  
  export interface Dataversion {
    columns: string[]
    data: number[][]
  }
  
  export interface MarketdataYields {
    columns: string[]
    data: any[]
  }