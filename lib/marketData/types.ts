export interface MarketQuote {
  ticker: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  exchange: string;
  marketTime: string;
  sector?: string;
}

export interface MarketDataProvider {
  name: string;
  getQuote(ticker: string, exchange?: string): Promise<MarketQuote | null>;
}
