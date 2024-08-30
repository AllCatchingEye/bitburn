import { NS } from '@ns';

export async function main(ns: NS) {
  const dummyContract = ns.codingcontract.createDummyContract('Algorithmic Stock Trader I');
  const contractData = ns.codingcontract.getData(dummyContract);

  const stocks = contractData[0];
}

function stockTraderI(stocks: number[]) {
  let bestProfit = 0;
  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    const profit: number = calcProfit(stock, stocks.slice(i + 1));

    if (profit > bestProfit) {
      bestProfit = profit;
    }
  }

  return bestProfit;
}

function calcProfit(bought: number, stocks: number[]) {
  let bestProfit = 0;
  for (const sold of stocks) {
    const profit = sold - bought;

    if (profit > bestProfit) {
      bestProfit = profit;
    }
  }
  return bestProfit;
}

/*
Find Largest Prime Factor
Subarray with Maximum Sum
Total Ways to Sum
Total Ways to Sum II
Spiralize Matrix
Array Jumping Game
Array Jumping Game II
Merge Overlapping Intervals
Generate IP Addresses
Algorithmic Stock Trader I
Algorithmic Stock Trader II
Algorithmic Stock Trader III
Algorithmic Stock Trader IV
Minimum Path Sum in a Triangle
Unique Paths in a Grid I
Unique Paths in a Grid II
Shortest Path in a Grid
Sanitize Parentheses in Expression
Find All Valid Math Expressions
HammingCodes: Integer to Encoded Binary
HammingCodes: Encoded Binary to Integer
Proper 2-Coloring of a Graph
Compression I: RLE Compression
Compression II: LZ Decompression
Compression III: LZ Compression
Encryption I: Caesar Cipher
Encryption II: Vigenère Cipher
*/
