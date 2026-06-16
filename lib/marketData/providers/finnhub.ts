import type { MarketDataProvider, MarketQuote } from "../types";

export const finnhubProvider: MarketDataProvider = {
  name: "finnhub",

  async getQuote(ticker: string, exchange?: string): Promise<MarketQuote | null> {
    const apiKey = process.env.MARKET_DATA_API_KEY;
    if (!apiKey) return null;

    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${apiKey}`
      );
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.c) return null;

      const price = json.c as number;
      const prev = (json.pc ?? price) as number;
      const change = price - prev;
      const changePercent = prev > 0 ? (change / prev) * 100 : 0;

      return {
        ticker,
        price,
        currency: "USD",
        change,
        changePercent,
        exchange: exchange ?? "",
        marketTime: new Date((json.t ?? Date.now() / 1000) * 1000).toISOString(),
      };
    } catch {
      return null;
    }
  },
};
