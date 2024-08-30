import { NS } from '@ns';

export async function main(ns: NS) {
  await upgradeServers(ns);
}

export async function upgradeServers(ns: NS) {
  //ns.write('upgrade.txt', ``, 'w');

  const baseRam = 2;
  await purchaseAllServers(ns, baseRam);
  await upgradeAllServers(ns, baseRam);
}

async function purchaseAllServers(ns: NS, baseRam: number) {
  while (!purchasedAllServers(ns)) {
    tryServerPurchase(ns, baseRam);
    await ns.sleep(1000);
  }
}

async function upgradeAllServers(ns: NS, baseRam: number) {
  while (true) {
    const purchasedServers = ['home'].concat(ns.getPurchasedServers());
    purchasedServers.forEach((server) => tryServerUpgrade(ns, baseRam, server));
    await ns.sleep(1000);
  }
}

function tryServerPurchase(ns: NS, ram: number) {
  if (hasEnoughMoneyForUpgrade(ns, ram)) {
    ns.purchaseServer('Server-', ram);
  }
}

function tryServerUpgrade(ns: NS, ram: number, server: string) {
  const ramUpgradeSize = getNextUpgradeSize(ns, ram, server);
  if (canPurchaseUpgrade(ns, server, ramUpgradeSize)) {
    ns.upgradePurchasedServer(server, ramUpgradeSize);
  }
}

function getNextUpgradeSize(ns: NS, ram: number, server: string) {
  const serverRam = ns.getServerMaxRam(server);
  const upgradeCount = Math.log2(serverRam);
  const ramUpgradeSize = ram ** (upgradeCount + 1);
  return ramUpgradeSize;
}

function canPurchaseUpgrade(ns: NS, server: string, ram: number) {
  return ns.getPurchasedServerUpgradeCost(server, ram) <= ns.getServerMoneyAvailable('home');
}

function hasEnoughMoneyForUpgrade(ns: NS, ram: number) {
  return ns.getPurchasedServerCost(ram) <= ns.getServerMoneyAvailable('home');
}

function purchasedAllServers(ns: NS) {
  return ns.getPurchasedServers().length == ns.getPurchasedServerLimit();
}
