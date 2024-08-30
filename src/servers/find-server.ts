import { NS } from '@ns';

/**
 * Main function to execute the script.
 * Retrieves the target server from command-line arguments, finds the path to the target server from 'home', and prints the path.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 */
export async function main(ns: NS) {
  const target = String(ns.args[0]);
  const serverPath = findServer(ns, 'home', target, [], []);

  ns.tprint(serverPath);
}


/**
 * Recursively finds a path from a starting host to a target server using depth-first search.
 *
 * @param {NS} ns - The Netscript environment object providing access to game functions.
 * @param {string} host - The current server or host from which to search.
 * @param {string} target - The name of the target server to find.
 * @param {string[]} path - The current path taken to reach the target server.
 * @param {string[]} visited - List of servers that have been visited to avoid cycles.
 * @returns {string[]} - An array representing the path from the starting host to the target server, including all intermediate servers.
 *                        Returns an empty array if the target server cannot be reached from the starting host.
 */
function findServer(ns: NS, host: string, target: string, path: string[], visited: string[]): string[] {
  if (visited.includes(host)) return [];

  visited.push(host);

  const newPath: string[] = path.concat(host);

  const servers = ns.scan(host);
  for (const server of servers) {
    if (server === target) {
      return newPath.concat(target);
    } else {
      const nextPath = findServer(ns, server, target, newPath, visited);

      if (nextPath.length > 0 && nextPath.includes(target)) {
        return nextPath;
      }
    }
  }

  return [];
}
