import { NS, Server } from "@ns";

export async function main(ns: NS): Promise<void> {
  const root: string = ns.args[0].toString();
  const foundServers = searchServers(ns, root);

  ns.tprint(`Found ${foundServers.length} servers:`);
  ns.tprint(foundServers);
}

export function searchServers(ns: NS, root: string): string[] {
  const serverFilter = new Set<string>();
  const searchResult = scanServer(ns, root, serverFilter);
  searchResult.push(root);
  return searchResult;
}

export function getUsableHosts(ns: NS): Server[] {
  const hosts: string[] = searchServers(ns, "home");
  const filteredHosts: Server[] = hosts.map((serverName) => ns.getServer(serverName))
    .filter((server) => server.hasAdminRights)
    .filter((server) => server.maxRam !== 0);
  return filteredHosts;
}

function scanServer(ns: NS, scanTarget: string, foundServersFilter: Set<string>): string[] {
  foundServersFilter.add(scanTarget);
  const foundServers = ns.scan(scanTarget);

  const newServers = filterFoundServers(ns, foundServers, foundServersFilter);
  const newServerFilter = addServersToFilter(newServers, foundServersFilter);

  const serverSearchResult: string[] = [...newServers];
  for (const newServer of newServers) {
    const newServerSearchResults = scanServer(ns, newServer, newServerFilter);
    serverSearchResult.push(...newServerSearchResults);
  }

  return serverSearchResult;
}

function addServersToFilter(servers: string[], serverFilter: Set<string>) {
  servers.forEach(server => serverFilter.add(server));
  return serverFilter;
}

function filterFoundServers(ns: NS, servers: string[], serverFilter: Set<string>): string[] {
  const filteredServers = servers.filter(server => !serverFilter.has(server));
  return filteredServers;
}
