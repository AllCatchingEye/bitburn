import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
  const stock = ns.stock;

  if (stock.hasTIXAPIAccess()) {
    stock.purchaseTixApi();
  }

  if (stock.has4SData()) {
    stock.purchase4SMarketData();
  }

  if (stock.has4SDataTIXAPI()) {
    stock.purchase4SMarketDataTixApi();
  }
}
