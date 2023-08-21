import { NS } from "@ns";

const SERVER_BASE_NAME: string = "pserv-";

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.disableLog("sleep");
  ns.disableLog("getServerMoneyAvailable");

  const ram = 2;
  await purchaseAllServers(ns, ram);
  await upgradeAllServers(ns, ram);
}

async function purchaseAllServers(ns: NS, ram: number) {
  let i = 0;
  while (i < ns.getPurchasedServerLimit()) {
    const serverName = SERVER_BASE_NAME + i;
    ns.print(`Trying to purchase server ${serverName}`);
    if (ns.serverExists(serverName)) {
      ns.print(`Server ${serverName} already exist.`);
      i++;
      continue;
    }

    if (canPurchaseServer(ns, ram)) {
      ns.purchaseServer(serverName, ram);
      ns.print(`Purchased server ${serverName}`);
      i++;
    } else {
      ns.print(`Coudn't purchase server ${serverName}`);
    }

    await ns.sleep(1000);
  }
}

async function upgradeAllServers(ns: NS, ram: number) {
  for (let exponent = 1; exponent < 20; exponent++) {
    const ramUpgradeSize = Math.pow(ram, exponent);
    await upgradeServer(ns, ramUpgradeSize);
  }
}

async function upgradeServer(ns: NS, ramUpgradeSize: number) {
  let i = 0;
  while (i < ns.getPurchasedServerLimit()) {
    const serverName = SERVER_BASE_NAME + i;
    ns.print(`Trying to upgrade ${serverName} to ${ramUpgradeSize}...`);
    if (canUpgradeServer(ns, serverName, ramUpgradeSize)) {
      ns.upgradePurchasedServer(serverName, ramUpgradeSize);
      ns.print(`Upgraded server ${serverName} to ${ramUpgradeSize}. ram`);
      i++;
    } else {
      ns.print(`Coudn't upgrade server ${serverName} to ${ramUpgradeSize} ram`);
    }

    await ns.sleep(1000);
  }
}

function canPurchaseServer(ns: NS, ram: number) {
  const availableMoney = ns.getServerMoneyAvailable("home");
  const serverPrice = ns.getPurchasedServerCost(ram);
  return availableMoney > serverPrice;
}

function canUpgradeServer(ns: NS, serverName: string, ram: number) {
  const availableMoney = ns.getServerMoneyAvailable("home");
  const upgradePrice = ns.getPurchasedServerUpgradeCost(serverName, ram);
  return availableMoney > upgradePrice;
}
