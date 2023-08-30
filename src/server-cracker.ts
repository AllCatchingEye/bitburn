import { NS, Server } from "../NetscriptDefinitions";
import { hackLevelEnough } from "/lib/helper-functions";
import { searchServers } from "/lib/searchServers";

export async function main(ns: NS): Promise<void> {
  disableLogs(ns);

  const root = "home";
  
  while (true) {
    const servers: string[] = searchServers(ns, root);
    await crackServers(ns, servers);

    await ns.sleep(10000);
  }
}

/**
 * Tries to crack all servers of a list with server names
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {string[]} servers - List of server names which should be cracked
 */
export function crackServers(ns: NS, servers: string[]): void {
  const uncrackedServers: Set<string> = new Set<string>(servers);
  const crackedServers: Set<string> = new Set<string>();

  for (const serverName of servers) {
    const server = ns.getServer(serverName);

    if (server.hasAdminRights) {
      uncrackedServers.delete(server.hostname);
      crackedServers.add(server.hostname);

      copyHackingScripts(ns, server.hostname);
      continue;
    }

    if (canGetRootAccess(ns, server)) {
      getRootAccess(ns, server);

      uncrackedServers.delete(server.hostname);
      crackedServers.add(server.hostname);
    }

    copyHackingScripts(ns, server.hostname);
  }

  printCrackProgress(ns, crackedServers, uncrackedServers);
}

/**
 * Copies scripts of the hacking functions to the given destination
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {string} destination - Where the scripts should be copied to
 */
function copyHackingScripts(ns: NS, destination: string) {
  const scripts: string[] = ["/hacking/grow.js", "/hacking/hack.js", "/hacking/weaken.js"];
  ns.scp(scripts, destination);
}

/**
 * Disables logging for specified functions
 * @param {NS} ns - Mandatory to access netscript functions
 */
function disableLogs(ns: NS) {
  ns.disableLog("getHackingLevel");
  ns.disableLog("getServerRequiredHackingLevel");
  ns.disableLog("brutessh");
  ns.disableLog("ftpcrack");
  ns.disableLog("nuke");
  ns.disableLog("scan");
}

/**
 * Prints out current cracking progress
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {Set<string>} crackedServers - Set containing cracked servers
 * @param {Set<string>} uncrackedServers - Set containig uncracked servers
 */
function printCrackProgress(
  ns: NS,
  crackedServers: Set<string>,
  uncrackedServers: Set<string>
) {
  ns.print(`INFO Cracked servers:`);
  crackedServers.forEach((server) => ns.print(server));

  ns.print(`INFO Uncracked servers:`);
  uncrackedServers.forEach((server) => ns.print(server));
}

/**
 * Checks if the given server can be cracked by
 * * Checking if the hacking level is high enough
 * * Checking if it can open enough ports on a server to get admin rights
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {Server} server - Server that will be checked
 * @returns If the server can be cracked
 */
function canGetRootAccess(ns: NS, server: Server): boolean {
  return (
    hackLevelEnough(ns, server.hostname) && canOpenAllRequiredPorts(ns, server)
  );
}

/**
 * Cracks the given server by opening ports and executing nuke
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {Server} server - Server which will be cracked
 */
function getRootAccess(ns: NS, server: Server) {
  openPorts(ns, server.hostname);
  ns.nuke(server.hostname);
}

/**
 * Checks if the required amount of ports can be opened on a server
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {Server} server - Server that will be checked
 * @returns If the required amount of ports can be opened
 */
function canOpenAllRequiredPorts(ns: NS, server: Server): boolean {
  const portsAreOpen = server.hasAdminRights;
  if (portsAreOpen) {
    return true;
  } else if (server.numOpenPortsRequired !== undefined) {
    const ownedPortOpenersCount = countPortOpeners(ns);
    return ownedPortOpenersCount >= server.numOpenPortsRequired;
  } else {
    return false;
  }
}

function countPortOpeners(ns: NS) {
  const portOpeners = [
    "BruteSSH.exe",
    "FTPCrack.exe",
    "relaySTMP.exe",
    "HTTPWorm.exe",
    "SQLInject.exe",
  ];

  let ownedPortOpenersCount = 0;
  for (const portOpener of portOpeners) {
    ownedPortOpenersCount += Number(ns.fileExists(portOpener));
  }

  return ownedPortOpenersCount;
}

/**
 * Opens all openable ports of the given host
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {string} host - Host for which the ports will be opened
 */
function openPorts(ns: NS, host: string) {
  ns.print(`Initilizing server ${host} for scripts...`);

  if (ns.fileExists("BruteSSH.exe")) {
    ns.brutessh(host);
  }

  if (ns.fileExists("FTPCrack.exe")) {
    ns.ftpcrack(host);
  }

  if (ns.fileExists("relaySTMP.exe")) {
    ns.relaysmtp(host);
  }

  if (ns.fileExists("HTTPWorm.exe")) {
    ns.httpworm(host);
  }

  if (ns.fileExists("SQLInject.exe")) {
    ns.sqlinject(host);
  }
}
