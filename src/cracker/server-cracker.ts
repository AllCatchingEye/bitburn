import { NS, Server } from "../../NetscriptDefinitions";
import { canOpenAllRequiredPorts, openPorts } from "/cracker/Ports";
import { hackLevelEnough } from "/lib/helper-functions";
import { searchServers } from "/lib/searchServers";
import { getScriptsList } from "/Scripts";

export async function main(ns: NS): Promise<void> {
  disableLogs(ns);

  const root = ns.getServer("home");
  while (true) {
    const servers: Server[] = searchServers(ns, root);
    await crackServers(ns, servers);

    await ns.sleep(1000);
  }
}

/**
 * Tries to crack all servers of a list with server names
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {string[]} servers - List of server names which should be cracked
 */
export async function crackServers(ns: NS, servers: Server[]): Promise<void> {
  for (const server of servers) {
    await crackServer(ns, server);
  }

  await ns.sleep(1000);
}

async function crackServer(ns: NS, server: Server): Promise<void> {
  if (canCrack(ns, server)) {
    await copyScripts(ns, server);

    openPorts(ns, server);
  }
}

function canCrack(ns: NS, host: Server) {
  const canHack = hackLevelEnough(ns, host);
  const isNotCracked = !serverCracked(ns, host);
  const canOpenPorts = canOpenAllRequiredPorts(ns, host);

  const canCrack = canHack && isNotCracked && canOpenPorts;
  return canCrack;
}

function serverCracked(ns: NS, server: Server) {
  const filesCopied = filesExists(ns, server);
  const isCracked = (server.hasAdminRights ?? true) && filesCopied;
  return isCracked;
}

function filesExists(ns: NS, server: Server) {
  const files = getScriptsList();
  const filesCopied = files.every((file) =>
    ns.fileExists(file, server.hostname),
  );
  return filesCopied;
}

/**
 * Copies scripts of the hacking functions to the given destination
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {string} destination - Where the scripts should be copied to
 */
async function copyScripts(ns: NS, destination: Server) {
  const scripts: string[] = getScriptsList();
  await ns.scp(scripts, destination.hostname);
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
