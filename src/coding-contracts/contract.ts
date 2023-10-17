export enum CCTypes {
  StockTrader1 = "Algorithmic Stock Trader I",
  Encryption1 = "Encryption I: Caesar Cipher",
  //StockTrader2 = "Algorithmic Stock Trader II",
  //StockTrader3 = "Algorithmic Stock Trader III",
  //StockTrader4 = "Algorithmic Stock Trader IV",
}

export interface CC {
  filename: string;
  data: string;
  ccType: string;
  solution: number | string;
  reward: string;
}

export async function main(ns: NS): Promise<void> {
  const filename = "";
  const ccType = ns.codingcontract.getContractType(filename);
  const solution = getSolution(ns, filename, ccType);
  ns.codingcontract.attempt(solution, filename);
}

export function getSolution(ns: NS, filename: string, type: string): number {
  let solution = 0;
  let stockPrices = [];
  switch (type) {
    case CCTypes.StockTrader1:
      stockPrices = ns.codingcontract.getData(filename);
      solution = getBestTradeI(stockPrices);
      break;
    default:
      break;
  }
  return solution;
}

/*
Array Jumping Game II
You are attempting to solve a Coding Contract. You have 3 tries remaining, after which the contract will self-destruct.
You are given the following array of integers:
2,3,4,1,3,2,0,3,3,4,2,3,3,2,1
Each element in the array represents your MAXIMUM jump length at that position. This means that if you are at position i and your maximum jump length is n, you can jump to any position from i to i+n.
Assuming you are initially positioned at the start of the array, determine the minimum number of jumps to reach the end of the array.
If it's impossible to reach the end, then the answer should be 0.
*/
function solveJumpingGame(jumps: number[]): number {
  const start = jumps[0];
  return 0;
}
