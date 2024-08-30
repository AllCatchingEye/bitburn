import { NS } from '@ns';

/**
 * Main entry point of the script.
 * Calls the `upgradeServers` function to handle server purchasing and upgrading.
 *
 * @param ns - The Netscript environment object provided by the game.
 */
export async function main(ns: NS) {
  await upgradeServers(ns);
}

/**
 * Manages the purchasing and upgrading of servers.
 * First, it purchases all servers up to the limit, then upgrades their RAM.
 *
 * @param ns - The Netscript environment object provided by the game.
 */
export async function upgradeServers(ns: NS) {
  //ns.write('upgrade.txt', ``, 'w');

  const baseRam = 2;
  await purchaseAllServers(ns, baseRam);
  await upgradeAllServers(ns, baseRam);
}

/**
 * Purchases new servers until the purchased server limit is reached.
 * It attempts to purchase servers at regular intervals.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param baseRam - The RAM size to use for new server purchases.
 */
async function purchaseAllServers(ns: NS, baseRam: number) {
  while (!purchasedAllServers(ns)) {
    tryServerPurchase(ns, baseRam);
    await ns.sleep(1000);
  }
}

/**
 * Upgrades the RAM of all purchased servers.
 * It repeatedly checks and upgrades servers at regular intervals.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param baseRam - The base RAM size used for calculating upgrades.
 */
async function upgradeAllServers(ns: NS, baseRam: number) {
  while (true) {
    const purchasedServers = ['home'].concat(ns.getPurchasedServers());
    purchasedServers.forEach((server) => tryServerUpgrade(ns, baseRam, server));
    await ns.sleep(1000);
  }
}

/**
 * Attempts to purchase a new server with the specified RAM size if there is enough money.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param ram - The amount of RAM for the new server.
 */
function tryServerPurchase(ns: NS, ram: number) {
  if (hasEnoughMoneyForUpgrade(ns, ram)) {
    ns.purchaseServer('Server-', ram);
  }
}

/**
 * Attempts to upgrade the RAM of a specified server if there is enough money for the upgrade.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param ram - The base RAM size used for upgrade calculations.
 * @param server - The hostname of the server to upgrade.
 */
function tryServerUpgrade(ns: NS, ram: number, server: string) {
  const ramUpgradeSize = getNextUpgradeSize(ns, ram, server);
  if (canPurchaseUpgrade(ns, server, ramUpgradeSize)) {
    ns.upgradePurchasedServer(server, ramUpgradeSize);
  }
}

/**
 * Calculates the next RAM upgrade size for a given server.
 * Uses the current RAM size and the server's existing RAM to determine the next upgrade.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param ram - The base RAM size used for calculations.
 * @param server - The hostname of the server to upgrade.
 * @returns The RAM size for the next upgrade.
 */
function getNextUpgradeSize(ns: NS, ram: number, server: string) {
  const serverRam = ns.getServerMaxRam(server);
  const upgradeCount = Math.log2(serverRam);
  const ramUpgradeSize = ram ** (upgradeCount + 1);
  return ramUpgradeSize;
}

/**
 * Checks if there is enough money available to purchase an upgrade for a server.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param server - The hostname of the server to check.
 * @param ram - The RAM size for the upgrade.
 * @returns True if there is enough money for the upgrade, otherwise false.
 */
function canPurchaseUpgrade(ns: NS, server: string, ram: number) {
  return ns.getPurchasedServerUpgradeCost(server, ram) <= ns.getServerMoneyAvailable('home');
}

/**
 * Checks if there is enough money available to purchase a new server with the specified RAM size.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param ram - The RAM size for the new server.
 * @returns True if there is enough money for the purchase, otherwise false.
 */
function hasEnoughMoneyForUpgrade(ns: NS, ram: number) {
  return ns.getPurchasedServerCost(ram) <= ns.getServerMoneyAvailable('home');
}

/**
 * Checks if the maximum number of servers have been purchased.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @returns True if the number of purchased servers equals the limit, otherwise false.
 */
function purchasedAllServers(ns: NS) {
  return ns.getPurchasedServers().length == ns.getPurchasedServerLimit();
}
