import type { MarketDataProvider, MarketQuote } from "../types";

export const alphaVantageProvider: MarketDataProvider = {
  name: "alphavantage",

  async getQuote(ticker: string, exchange?: string): Promise<MarketQuote | null> {
    const apiKey = process.env.MARKET_DATA_API_KEY;
    if (!apiKey) return null;

    try {
      const res = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`
      );
      if (!res.ok) return null;
      const json = await res.json();
      const q = json["Global Quote"];
      if (!q || !q["05. price"]) return null;

      const price = parseFloat(q["05. price"]);
      const change = parseFloat(q["09. change"] ?? "0");
      const changePercent = parseFloat((q["10. change percent"] ?? "0").replace("%", ""));

      return {
        ticker,
        price,
        currency: "USD",
        change,
        changePercent,
        exchange: exchange ?? "",
        marketTime: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  },
};
