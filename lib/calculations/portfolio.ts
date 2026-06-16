import type { InvestmentHolding, HoldingWithQuote } from "../types";

export function buildTickerSymbol(holding: InvestmentHolding): string {
  if (holding.exchange && !holding.ticker.includes(".")) {
    return `${holding.ticker}.${holding.exchange}`;
  }
  return holding.ticker;
}

export function enrichHolding(
  holding: InvestmentHolding,
  quote: { price: number; change: number; changePercent: number } | null
): HoldingWithQuote {
  const currentPrice =
    quote?.price ?? holding.latestPrice ?? holding.averagePurchasePrice;
  const costBasis = holding.shares * holding.averagePurchasePrice;
  const marketValue = holding.shares * currentPrice;
  const unrealisedGainLoss = marketValue - costBasis;
  const unrealisedGainLossPercent =
    costBasis > 0 ? (unrealisedGainLoss / costBasis) * 100 : 0;

  return {
    ...holding,
    currentPrice,
    marketValue,
    costBasis,
    unrealisedGainLoss,
    unrealisedGainLossPercent,
    dailyChange: quote?.change ?? 0,
    dailyChangePercent: quote?.changePercent ?? 0,
    priceIsStale: !quote && holding.latestPrice != null,
  };
}

export function getPortfolioSummary(holdings: HoldingWithQuote[]) {
  const totalValue = holdings.reduce((s, h) => s + h.marketValue, 0);
  const totalCost = holdings.reduce((s, h) => s + h.costBasis, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  const byHolding = holdings.map((h) => ({
    name: h.stockName,
    value: h.marketValue,
    gainLoss: h.unrealisedGainLoss,
  }));

  const byCountry = aggregateBy(holdings, (h) => h.country || "Unknown", (h) => h.marketValue);
  const byCurrency = aggregateBy(holdings, (h) => h.currency, (h) => h.marketValue);
  const bySector = aggregateBy(holdings, (h) => h.sector || "Unknown", (h) => h.marketValue);

  return {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    byHolding,
    byCountry,
    byCurrency,
    bySector,
  };
}

function aggregateBy(
  holdings: HoldingWithQuote[],
  keyFn: (h: HoldingWithQuote) => string,
  valFn: (h: HoldingWithQuote) => number
) {
  const map = new Map<string, number>();
  for (const h of holdings) {
    const key = keyFn(h);
    map.set(key, (map.get(key) ?? 0) + valFn(h));
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export async function fetchQuoteForHolding(
  holding: InvestmentHolding
): Promise<{ price: number; change: number; changePercent: number; sector?: string } | null> {
  try {
    const params = new URLSearchParams({ ticker: holding.ticker });
    if (holding.exchange) params.set("exchange", holding.exchange);
    const res = await fetch(`/api/market-data/quote?${params}`);
    if (!res.ok) return null;
    const quote = await res.json();
    return {
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      sector: quote.sector,
    };
  } catch {
    return null;
  }
}

export function getTotalPortfolioValue(holdings: InvestmentHolding[]): number {
  return holdings.reduce((sum, h) => {
    const price = h.latestPrice ?? h.averagePurchasePrice;
    return sum + h.shares * price;
  }, 0);
}
