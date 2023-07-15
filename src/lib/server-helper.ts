import { NS } from "@ns";

/**
 * Scans network for available servers
 * @param {NS} ns - NetScript library
 * @param {string} target - Where to start scanning for servers
 * @param {string} filter - Filters servers with filter provided
 * @param {boolean} lookRecursive - If set to true, it will find servers recursively
 * @returns {string[]} - List of servers
 */
export async function scanForServers(
  ns: NS,
  target: string,
  filter?: string,
  lookRecursive?: boolean
) {

  // Scans network for provided target
  let servers: Set<string> = new Set<string>(ns.scan(target));
  if (filter != undefined) {
    servers = await filterServers(ns, servers, filter);
  }

  // Scans found servers for subservers recursively 
  if (lookRecursive === true && servers.size > 1) {
    for (let server of servers) {
      const subServers = await scanForServers(ns, server, "home", lookRecursive);
      servers = new Set([...servers, ...subServers]);
    }
  }

  return servers;
}

/**
 * Filters a list of servers
 * @param ns - Netscript library
 * @param servers - Servers to be filtered
 * @param filter - String that filters servers
 * @returns - List of filtered servers
 */
export function filterServers(ns: NS, servers: Set<string>, filter: string) {
  const filteredServers = new Set<string>();
  for (let server of servers) {
    if (!server.includes(filter)) {
      filteredServers.add(server);
    }
  }
  return filteredServers;
}


