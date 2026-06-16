import type { MarketQuote } from "./types";
import { yahooFinanceProvider } from "./providers/yahooFinance";
import { alphaVantageProvider } from "./providers/alphaVantage";
import { finnhubProvider } from "./providers/finnhub";

const providers = {
  yahoo: yahooFinanceProvider,
  alphavantage: alphaVantageProvider,
  finnhub: finnhubProvider,
};

function getProvider() {
  const name = (process.env.MARKET_DATA_PROVIDER ?? "yahoo").toLowerCase();
  return providers[name as keyof typeof providers] ?? yahooFinanceProvider;
}

export async function getQuote(ticker: string, exchange?: string): Promise<MarketQuote | null> {
  const provider = getProvider();
  const quote = await provider.getQuote(ticker, exchange);
  if (quote) return quote;

  // Fallback to Yahoo if primary provider fails
  if (provider.name !== "yahoo") {
    return yahooFinanceProvider.getQuote(ticker, exchange);
  }
  return null;
}

export { type MarketQuote } from "./types";
