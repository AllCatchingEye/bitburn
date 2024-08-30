import { NS } from '@ns';

export async function main(ns: NS) {
  while (true) {
    ns.hacknet.purchaseNode();

    const ownedNodes = ns.hacknet.numNodes();
    for (let index = 0; index < ownedNodes; index++) {
      const levelCost = ns.hacknet.getLevelUpgradeCost(index);
      const ramCost = ns.hacknet.getRamUpgradeCost(index);
      const coreCost = ns.hacknet.getCoreUpgradeCost(index);

      const cheapestUpgrade = Math.min(levelCost, ramCost, coreCost);
      if (cheapestUpgrade == levelCost) {
        ns.hacknet.upgradeLevel(index);
      } else if (cheapestUpgrade == ramCost) {
        ns.hacknet.upgradeRam(index);
      } else {
        ns.hacknet.upgradeCore(index);
      }
    }
    await ns.sleep(100);
  }
}
