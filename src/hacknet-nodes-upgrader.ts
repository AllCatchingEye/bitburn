import { NS } from "@ns";

type Node = {
  id: number,
  upgrade: Upgrade,
}

type Upgrade = {
  type: UpgradeType,
  price: number,
}

enum UpgradeType {
  Level = 0,
  Ram = 1,
  Core = 2,
  Node = 3,
}

/** @param {NS} ns */
export async function main(ns: NS) {
  while (true) {
    const cheapestNode: Node = getCheapestNode(ns);
  
    upgradeHacknet(ns, cheapestNode);
    await ns.sleep(100);
  }
}

function upgradeHacknet(ns: NS, node: Node): Boolean {
  let purchaseSuccessful: boolean;
  switch (node.upgrade.type) {
    case UpgradeType.Level:
      purchaseSuccessful = ns.hacknet.upgradeLevel(node.id);
      break;
    case UpgradeType.Ram:
      purchaseSuccessful = ns.hacknet.upgradeRam(node.id);
      break;
    case UpgradeType.Core:
      purchaseSuccessful = ns.hacknet.upgradeCore(node.id);
      break;
    case UpgradeType.Node:
      if (ns.hacknet.purchaseNode() == -1) {
        purchaseSuccessful = false;
      } else {
        purchaseSuccessful = true;
      }
      break;
    default:
      purchaseSuccessful = false;
      ns.print(`WARNING Unknown upgrade type encountered: ${node.upgrade.type}`);
      break;
  }
  return purchaseSuccessful;
}

function getCheapestNode(ns: NS): Node {
  const nodeCount: number = ns.hacknet.numNodes();

  let currentCheapestNode: Node = getNode(ns, 0);
  for (let i = 1; i < nodeCount; i++) {
    const nextNode: Node = getNode(ns, i);
    
    currentCheapestNode = getCheaperNode(currentCheapestNode, nextNode);
  }

  return currentCheapestNode;
}

function getCheaperNode(currentNode: Node, nextNode: Node): Node {
  if (currentNode.upgrade.price < nextNode.upgrade.price) {
    return currentNode;
  } else {
    return nextNode;
  }
}

function getNode(ns: NS, index: number): Node {
  const node: Node = {
    id: index,
    upgrade: getCheapestUpgrade(ns, index),
  }
  return node;
}

function getCheapestUpgrade(ns: NS, i: number): Upgrade {
  const levelPrice = ns.hacknet.getLevelUpgradeCost(i);
  const ramPrice = ns.hacknet.getRamUpgradeCost(i);
  const corePrice = ns.hacknet.getCoreUpgradeCost(i);
  const nodePrice = ns.hacknet.getPurchaseNodeCost();
  const smallestPrice: number = Math.min(levelPrice, ramPrice, corePrice, nodePrice);

  let upgradeType: UpgradeType;
  if (smallestPrice == levelPrice) {
    upgradeType = UpgradeType.Level;
  } else if (smallestPrice == ramPrice) {
    upgradeType = UpgradeType.Ram;
  } else if (smallestPrice == corePrice) {
    upgradeType = UpgradeType.Core;
  } else {
    upgradeType = UpgradeType.Node;
  }

  const cheapestUpgrade: Upgrade = {
    price: smallestPrice,
    type: upgradeType,
  }
  return cheapestUpgrade;
}