function getBestTradeI(stockPrices: number[]) {
  let bestTrade = 0;
  for (let i = 0; i < stockPrices.length; i++) {
    const buy = stockPrices[i];
    const bestStockProfit = getBestProfit(buy, stockPrices.slice(i + 1));
    bestTrade = Math.max(bestStockProfit, bestTrade);
  }

  return bestTrade;
}

function getBestTradeI(stockPrices: number[]) {
  let bestTrade = 0;
  for (let i = 0; i < stockPrices.length; i++) {
    const buy = stockPrices[i];
    const bestStockProfit = getBestProfit(buy, stockPrices.slice(i + 1));
    bestTrade = Math.max(bestStockProfit, bestTrade);
  }

  return bestTrade;
}

function getBestProfit(buy: number, stockPrices: number[]): number {
  const profits = stockPrices
    .filter((sell) => sell > buy) // Filter unprofitable sells away
    .map((sell) => sell - buy); // Calculate profit for each trade

  const bestProfit = Math.max(...profits);
  return bestProfit;
}
