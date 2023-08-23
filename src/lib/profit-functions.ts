import { NS, Server } from "@ns";
import { searchServers } from "/lib/searchServers";

export async function main(ns: NS): Promise<void> {
  ns.tprint(mostProfitableServer(ns));
}

/**
 * Calculates the currently most profitable server to hack
 * @param {NS} ns - Mandatory to access netscript functions
 * @returns Most profitable server to hack
 */
export function mostProfitableServer(ns: NS): string {
  const servers = searchServers(ns, "home");

  const mostProfitableServer: Server = servers.reduce(
    (currentServer, nextServer) => {
      return getMoreProfitableServer(currentServer, ns.getServer(nextServer));
    },
    ns.getServer(servers[0])
  );

  return mostProfitableServer.hostname;
}

/**
 * Calculates the more profitable server of two given servers
 * @param {Server} server1 - First server
 * @param {Server} server2 - Second server
 * @returns The more profitable server
 */
function getMoreProfitableServer(server1: Server, server2: Server): Server {
  const server1Profit = getProfitOfServer(server1);
  const server2Profit = getProfitOfServer(server2);

  return server1Profit >= server2Profit ? server1 : server2;
}

/**
 * Calculates the profit of a server
 * @param {Server} server - The server for which the profit is being calculated
 * @returns The profit of a server
 */
export function getProfitOfServer(server: Server): number {
  if (canMakeProfit(server)) {
    /* neither of these variables can be undefined if you're in this case */
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return server.moneyMax! / server.minDifficulty!;
  } else {
    return 0;
  }
}

/**
 * Checks if you can make a profit on the given server
 * @param {Server} server - Server which is is checked for profit 
 * @returns If a server can make a profit
 */
function canMakeProfit(server: Server): boolean {
  return (
    server.hasAdminRights &&
    server.moneyMax !== undefined &&
    server.minDifficulty !== undefined
  );
}
