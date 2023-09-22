import { NS, Server } from "@ns";
import { searchServers } from "/lib/searchServers";

export async function main(ns: NS): Promise<void> {
  ns.tprint(getMostProfitableServer(ns));
}

export function getMostProfitableServer(ns: NS): Server {
  const servers: Server[] = getPossibleTargets(ns);
  const weightedServers: Map<Server, number> = weightServers(ns, servers);

  const mostProfitableServer: Server = findMostProfitableServer(
    ns,
    weightedServers,
  );

  return mostProfitableServer;
}

function weightServers(ns: NS, servers: Server[]): Map<Server, number> {
  // Weight each servers profitability
  const weightedServers = new Map();
  servers.forEach((server) => {
    const weight = Weight(ns, server);
    weightedServers.set(server, weight);
  });

  return weightedServers;
}

// Returns a weight that can be used to sort servers by hack desirability
function Weight(ns: NS, server: Server): number {
  if (!server) return 0;

  // Don't ask, endgame stuff
  if (server.hostname.startsWith("hacknet-node")) return 0;

  // Get the player information
  const player = ns.getPlayer();

  // Set security to minimum on the server object (for Formula.exe functions)
  server.hackDifficulty = server.minDifficulty;

  // We cannot hack a server that has more than our hacking skill server these have no value
  const requiredHackingSkill = server.requiredHackingSkill ?? 0;
  if (requiredHackingSkill > player.skills.hacking) return 0;

  // Default pre-Formulas.exe weight. minDifficulty directly affects times, so it substitutes for min security times
  const moneyMax = server.moneyMax ?? 0;
  const minDifficulty = server.minDifficulty ?? 0;
  let weight = moneyMax / minDifficulty;

  // If we have formulas, we can refine the weight calculation
  if (ns.fileExists("Formulas.exe")) {
    // We use weakenTime instead of minDifficulty since we got access to it,
    // and we add hackChance to the mix (pre-formulas.exe hack chance formula is based on current security, which is useless)
    weight =
      (moneyMax / ns.formulas.hacking.weakenTime(server, player)) *
      ns.formulas.hacking.hackChance(server, player);
  }
  // If we do not have formulas, we can't properly factor in hackchance,
  // so we lower the hacking level tolerance by half
  // Round to account for new start with hack skill 1
  else if (requiredHackingSkill > Math.ceil(player.skills.hacking / 2))
    return 0;

  return weight;
}

function findMostProfitableServer(
  ns: NS,
  weightedServers: Map<Server, number>,
): Server {
  let mostProfitableServer = "";
  let bestWeight = 0;

  // Look for server with highest weight
  for (const [server, weight] of weightedServers.entries()) {
    if (weight > bestWeight) {
      bestWeight = weight;
      mostProfitableServer = server.hostname;
    }
  }

  return ns.getServer(mostProfitableServer);
}

function getPossibleTargets(ns: NS): Server[] {
  const homeServer = ns.getServer("home");

  const possibleTargets: Server[] = searchServers(ns, homeServer)
    // Hacking skill must fullfill skill requirement of a server,
    // to be hackable by scripts
    .filter(
      (server) =>
        server.requiredHackingSkill ?? 0 <= ns.getPlayer().skills.hacking,
    );

  return possibleTargets;
}
