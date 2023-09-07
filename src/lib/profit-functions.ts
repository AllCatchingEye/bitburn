import { NS, Server } from "@ns";
import { searchServers } from "/lib/searchServers";

export async function main(ns: NS): Promise<void> {
  ns.tprint(mostProfitableServer(ns));
}

export function mostProfitableServer(ns: NS): string {
  const hackableServers: Server[] = getHackableServers(ns);
  const mostProfitableServer = findMostProfitableServer(hackableServers);

  return mostProfitableServer.hostname;
}

function findMostProfitableServer(hackableServers: Server[]): Server {
  const mostProfitableServer: Server = hackableServers.reduce(
    (currentServer, nextServer) => {
      return getMoreProfitableServer(currentServer, nextServer);
    },
  );
  return mostProfitableServer;
}

function getHackableServers(ns: NS): Server[] {
  const servers: Server[] = searchServers(ns, "home")
    .map(serverName => ns.getServer(serverName))
    .filter(server => !(server.requiredHackingSkill === undefined))
    .filter(server => server.requiredHackingSkill! <= ns.getPlayer().skills.hacking);
  return servers;
}

function getMoreProfitableServer(server1: Server, server2: Server): Server {
  const server1Profit = getProfitOfServer(server1);
  const server2Profit = getProfitOfServer(server2);

  return server1Profit >= server2Profit ? server1 : server2;
}

export function getProfitOfServer(server: Server): number {
  let profit = 0;
  if (canMakeProfitOn(server)) {
    /* neither of these variables can be undefined if you're in this case */
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    profit = server.moneyMax! / server.minDifficulty!;
    return profit;
  } else {
    return profit;
  }
}

function canMakeProfitOn(server: Server): boolean {
  const serverHasMoney = server.moneyMax !== undefined;
  const serverHasSecurity = server.minDifficulty !== undefined;

  return (
    server.hasAdminRights &&
    serverHasMoney &&
    serverHasSecurity
  );
}
