import { NS, Server } from "@ns";

export async function main(ns: NS): Promise<void> {
  const root: string = ns.args[0].toString();
  const rootServer = ns.getServer(root);

  let foundServers: Server[] = [];
  if (root == "all") {
    foundServers = searchServers(ns, rootServer);
  } else {
    foundServers = ns.scan(root).map((hostname) => ns.getServer(hostname));
  }

  ns.tprint(`Found ${foundServers.length} servers:`);
  ns.tprint(foundServers);
}

export function getServersFiltered(
  ns: NS,
  filters: RegExp[],
  host = "home",
): Server[] {
  const hostServer = ns.getServer(host);
  const servers = searchServers(ns, hostServer);
  const filteredServers = filterServers(filters, servers);
  return filteredServers;
}

function filterServers(filters: RegExp[], servers: Server[]): Server[] {
  let filteredServers: Server[] = [];
  for (const filter of filters) {
    const filterResult = servers.filter((server: Server) =>
      filter.test(server.hostname),
    );
    filteredServers = filteredServers.concat(filterResult);
  }
  return filteredServers;
}

export function searchServers(ns: NS, root: Server): Server[] {
  const found = new Set<string>();
  const searchResult: Server[] = scanServer(ns, root, found);
  searchResult.unshift(root);
  return searchResult;
}

export function getUsableHosts(ns: NS): Server[] {
  const homeServer = ns.getServer("home");
  const hosts: Server[] = searchServers(ns, homeServer);
  const filteredHosts: Server[] = hosts
    .map((host: Server) => ns.getServer(host.hostname))
    .filter((server) => server.hasAdminRights)
    .filter((server) => server.maxRam !== 0);
  return filteredHosts;
}

function scanServer(ns: NS, scanTarget: Server, found: Set<string>): Server[] {
  found.add(scanTarget.hostname);
  const foundServers = ns
    .scan(scanTarget.hostname)
    .map((hostname) => ns.getServer(hostname));

  const newServers: Server[] = filterFoundServers(foundServers, found);
  const newServerFilter: Set<string> = addServersToFilter(newServers, found);

  const serverSearchResult: Server[] = [...newServers];
  for (const newServer of newServers) {
    const newServerSearchResults = scanServer(ns, newServer, newServerFilter);
    serverSearchResult.push(...newServerSearchResults);
  }

  return serverSearchResult;
}

function addServersToFilter(
  servers: Server[],
  serverFilter: Set<string>,
): Set<string> {
  servers.forEach((server) => serverFilter.add(server.hostname));
  return serverFilter;
}

function filterFoundServers(
  servers: Server[],
  serverFilter: Set<string>,
): Server[] {
  const filteredServers: Server[] = servers.filter(
    (server) => !serverFilter.has(server.hostname),
  );
  return filteredServers;
}
