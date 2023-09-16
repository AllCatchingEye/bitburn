import { NS } from "@ns";

interface Upgrade {
  type: number,
  nodeIndex: number,
}

export async function main(ns: NS) {
  let delayTime = ns.args[0] || 1000;
  let thresholdMultiplier = ns.args[1] || 1; //Bigger threshold, the less it spends

  while (true) {
    let minValue = ns.hacknet.getPurchaseNodeCost();
    const upgrade: Upgrade = getUpgrade(ns, minValue);

    await waitForMoney(ns, minValue, delayTime, thresholdMultiplier);
    upgradeHacknode(ns, upgrade);

    await ns.sleep(1);
  }
}

function getUpgrade(ns: NS, cheapestUpgradeCost: number): Upgrade {
  let ownedNodes = ns.hacknet.numNodes();
  let upgrade: Upgrade = {
    nodeIndex: ownedNodes,
    type: -1
  }

  for (let i = 0; i < ownedNodes; i++) {
    let upgrades = [
      ns.hacknet.getLevelUpgradeCost(i, 1),
      ns.hacknet.getRamUpgradeCost(i, 1),
      ns.hacknet.getCoreUpgradeCost(i, 1)
    ];

    let upgradeCost = getCheapestUpgradeCost(upgrades);
    const upgradeIsCheaper = upgradeCost < cheapestUpgradeCost;
    if (upgradeIsCheaper) {
      cheapestUpgradeCost = upgradeCost;
      upgrade.nodeIndex = i;
      upgrade.type = upgrades.indexOf(upgradeCost);
    }
  }
  return upgrade;
}

function getCheapestUpgradeCost(upgrades: any) {
  return Math.min.apply(Math, upgrades)
}

function upgradeHacknode(ns: NS, upgrade: Upgrade) {
  switch (upgrade.type) {
    case -1:
      ns.hacknet.purchaseNode();
      break;
    case 0:
      ns.hacknet.upgradeLevel(upgrade.nodeIndex, 1);
      break;
    case 1:
      ns.hacknet.upgradeRam(upgrade.nodeIndex, 1);
      break;
    case 2:
      ns.hacknet.upgradeCore(upgrade.nodeIndex, 1);
      break;
  }
}

async function waitForMoney(ns: NS, targetMoney: number, delayTime: any, thresholdMultiplier: any) {
  while (ns.getPlayer().money / thresholdMultiplier < targetMoney) {
    await ns.sleep(delayTime);
  }
}
