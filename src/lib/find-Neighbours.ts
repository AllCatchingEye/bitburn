import { NS } from "@ns";

/**
 * Scans network for available servers
 * @param {NS} ns - NetScript library
 * @param {string} target - Where to start scanning for servers
 * @param {string} filter - Filters servers with filter provided
 * @param {boolean} lookRecursive - If set to true, it will find servers recursively
 * @returns {string[]} - List of servers
 */
export async function findServers(
  ns: NS,
  target: string,
  filter?: string,
  lookRecursive?: boolean
) {

  // Scans network for provided target
  let servers = new Set<string>(ns.scan(target));
  if (filter != undefined) {
    servers = await filterServers(ns, servers, filter);
  }

  // Scans found servers for subservers recursively 
  if (lookRecursive === true && servers.size > 1) {
    for (let server of servers) {
      const subServers = await findServers(ns, server, "home", lookRecursive);
      servers = new Set([...servers, ...subServers]);
    }
  }

  return servers;
}


