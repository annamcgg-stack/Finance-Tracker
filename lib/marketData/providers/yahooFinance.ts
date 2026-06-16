import type { MarketDataProvider, MarketQuote } from "../types";

/** Yahoo Finance via public chart endpoint (development-friendly, no API key) */
export const yahooFinanceProvider: MarketDataProvider = {
  name: "yahoo",

  async getQuote(ticker: string, exchange?: string): Promise<MarketQuote | null> {
    const symbol = exchange && !ticker.includes(".") ? `${ticker}.${exchange}` : ticker;
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 FinanceTracker/1.0" },
        next: { revalidate: 300 },
      });
      if (!res.ok) return null;

      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice) return null;

      const price = meta.regularMarketPrice as number;
      const prev = (meta.chartPreviousClose ?? meta.previousClose ?? price) as number;
      const change = price - prev;
      const changePercent = prev > 0 ? (change / prev) * 100 : 0;

      return {
        ticker: meta.symbol ?? symbol,
        price,
        currency: meta.currency ?? "USD",
        change,
        changePercent,
        exchange: exchange ?? "",
        marketTime: new Date((meta.regularMarketTime ?? Date.now() / 1000) * 1000).toISOString(),
      };
    } catch {
      return null;
    }
  },
};
