import { NS, Server } from "@ns";
import { searchServers } from "/lib/searchServers";

export async function main(ns: NS): Promise<void> {
  ns.tprint(mostProfitableServer(ns));
}

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

function getMoreProfitableServer(server1: Server, server2: Server): Server {
  const server1Profit = getProfitOfServer(server1);
  const server2Profit = getProfitOfServer(server2);

  return server1Profit >= server2Profit ? server1 : server2;
}

export function getProfitOfServer(server: Server): number {
  if (canMakeProfit(server)) {
    /* neither of these variables can be undefined if you're in this case */
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return server.moneyMax! / server.minDifficulty!;
  } else {
    return 0;
  }
}

function canMakeProfit(server: Server): boolean {
  return (
    server.hasAdminRights &&
    server.moneyMax !== undefined &&
    server.minDifficulty !== undefined
  );
}
