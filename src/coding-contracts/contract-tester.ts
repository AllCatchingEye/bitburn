import { NS } from "/../NetscriptDefinitions";
import { CCTypes, CC, getSolution } from "/coding-contracts/contract";

export async function main(ns: NS): Promise<void> {
  testCCType(ns, CCTypes.StockTrader1);
}

function testCCType(ns: NS, ccType: string): void {
  ns.codingcontract.createDummyContract(ccType);

  const filename = getCCFilename(ns);
  const data = ns.codingcontract.getData(filename);
  const solution: number = getSolution(ns, filename, ccType);
  const reward = ns.codingcontract.attempt(solution, filename);

  const cc: CC = {
    ccType: ccType,
    filename: filename,
    data: data,
    solution: solution,
    reward: reward,
  };

  evalReward(ns, cc);
  ns.rm(filename);
}

function evalReward(ns: NS, cc: CC): void {
  if (cc.reward == "") {
    ns.tprint(
      `
      WARNING Solution was incorrect for 
      ${cc.data}.
      Solution provided was ${cc.solution}.
      `,
    );
  } else {
    ns.tprint(`SUCCESS Solution was correct`);
  }
}

function getCCFilename(ns: NS): string {
  const ccFiles = ns.ls("home", ".cct");
  const ccFilename = ccFiles[0];
  return ccFilename;
}
