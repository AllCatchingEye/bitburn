import { NS } from '@ns';
import { canHack } from '../utility/utility-functions';

/**
 * Performs a depth-first search (DFS) to scan all servers from a starting host.
 * This function will recursively visit all servers connected to the starting host.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param host - The starting server for the DFS scan.
 * @param visited - An array to keep track of visited servers.
 * @returns An array of all visited servers.
 */
export function DepthFirstServerScan(ns: NS, host: string, visited: string[]) {
  visited.push(host);
  const servers = ns.scan(host);
  for (const server of servers) {
    if (!visited.includes(server)) {
      DepthFirstServerScan(ns, server, visited);
    }
  }

  return visited;
}

/**
 * Retrieves a list of servers that have root access.
 * This function starts scanning from 'home' and filters the servers that have root access.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @returns An array of server hostnames that have root access.
 */
export function getRunnableServers(ns: NS) {
  const servers = DepthFirstServerScan(ns, 'home', []);
  const runnableServers = servers.filter((server) => ns.hasRootAccess(server));
  return runnableServers;
}

/**
 * Determines the most profitable server from a list of servers.
 * The server is evaluated based on a calculated "weight," which is influenced by its money capacity and difficulty.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param servers - An array of server hostnames to evaluate.
 * @returns The hostname of the most profitable server.
 */
export function getMostProfitableServer(ns: NS, servers: string[]) {
  let bestWeight = 0;
  let bestServer = 'n00dles';
  for (const server of servers) {
    if (!canHack(ns, server) || !ns.hasRootAccess(server)) {
      continue;
    }

    const weight = Weight(ns, server);
    if (weight > bestWeight) {
      bestWeight = weight;
      bestServer = server;
    }
  }

  return bestServer;
}

/**
 * Calculates a weight for a given server based on its money capacity, difficulty, and hacking requirements.
 * The weight represents the server's profitability and is used to determine the most profitable server.
 *
 * @param ns - The Netscript environment object provided by the game.
 * @param serverName - The hostname of the server to evaluate.
 * @returns A numerical weight representing the server's profitability.
 */
function Weight(ns: NS, serverName: string) {
  if (!serverName) return 0;

  // Don't ask, endgame stuff
  if (serverName.startsWith('hacknet-node')) return 0;

  // Get the player information
  const player = ns.getPlayer();

  // Get the server information
  const server = ns.getServer(serverName);

  if (server.moneyMax != undefined && server.requiredHackingSkill != undefined && server.minDifficulty != undefined) {
    // Set security to minimum on the server object (for Formula.exe functions)
    server.hackDifficulty = server.minDifficulty;

    // We cannot hack a server that has more than our hacking skill so these have no value
    if (server.requiredHackingSkill > player.skills.hacking) return 0;

    // Default pre-Formulas.exe weight. minDifficulty directly affects times, so it substitutes for min security times
    let weight = server.moneyMax / server.minDifficulty;

    // If we have formulas, we can refine the weight calculation
    if (ns.fileExists('Formulas.exe')) {
      // We use weakenTime instead of minDifficulty since we got access to it,
      // and we add hackChance to the mix (pre-formulas.exe hack chance formula is based on current security, which is useless)
      weight =
        (server.moneyMax / ns.formulas.hacking.weakenTime(server, player)) *
        ns.formulas.hacking.hackChance(server, player);
    }
    // If we do not have formulas, we can't properly factor in hackchance, so we lower the hacking level tolerance by half
    else if (server.requiredHackingSkill > player.skills.hacking / 2) return 0;

    return weight;
  } else return 0;
}
