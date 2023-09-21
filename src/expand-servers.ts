import { NS, Server } from "@ns";
import { getServersFiltered } from "./lib/searchServers";

const SERVER_BASE_NAME = "pserv-";

/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {
  ns.disableLog("sleep");
  ns.disableLog("getServerMoneyAvailable");

  await purchaseAllServers(ns);

  const filters: RegExp[] = getRegexFor(["home", "pserv-[0-9]*"]);
  const servers = getServersFiltered(ns, filters);
  await upgradeRoutine(ns, servers);
}

function getRegexFor(strings: string[]): RegExp[] {
  const filters: RegExp[] = strings.map((string) => new RegExp(string));
  return filters;
}

async function purchaseAllServers(ns: NS): Promise<void> {
  let i = 0;
  while (i < ns.getPurchasedServerLimit()) {
    const serverName = SERVER_BASE_NAME + i;
    if (ns.serverExists(serverName)) {
      i++;
      continue;
    } else {
      await purchaseServer(ns, serverName);
      i++;
    }

    await ns.sleep(1000);
  }
}

// Will wait till the player can afford to purchase a server,
// and purchases it afterwards
async function purchaseServer(ns: NS, serverName: string): Promise<void> {
  const ram = 2; // Use cheapest option, server will be upgraded afterwards

  // Wait till the server is purchasable
  while (!canPurchaseServer(ns, ram)) {
    await ns.sleep(1000);
  }

  ns.purchaseServer(serverName, ram);
}

function canPurchaseServer(ns: NS, ram: number): boolean {
  const availableMoney = ns.getServerMoneyAvailable("home");
  const serverPrice = ns.getPurchasedServerCost(ram);
  return availableMoney > serverPrice;
}

async function upgradeRoutine(ns: NS, servers: Server[]): Promise<void> {
  while (true) {
    upgradeServers(ns, servers);
    await ns.sleep(1000);
  }
}

function upgradeServers(ns: NS, servers: Server[]): void {
  servers.forEach((server) => {
    tryUpgradeServer(ns, server);
  });
}

function tryUpgradeServer(ns: NS, server: Server): void {
  const ramUpgradeSize = server.maxRam ** 2;
  ns.upgradePurchasedServer(server.hostname, ramUpgradeSize);
}
