import { NS, Server } from "../../NetscriptDefinitions";
import { hackLevelEnough } from "/lib/helper-functions";
import { searchServers } from "/lib/searchServers";

export async function main(ns: NS): Promise<void> {
  disableLogs(ns);

  const root: string = ns.args[0] as string;
  const servers: string[] = searchServers(ns, root);

  while (true) {
    await crackServers(ns, servers);

    await ns.sleep(10000);
  }
}

export function crackServers(ns: NS, servers: string[]): void {
  const uncrackedServers: Set<string> = new Set<string>(servers);
  const crackedServers: Set<string> = new Set<string>();

  for (const serverName of servers) {
    const server = ns.getServer(serverName);

    if (server.hasAdminRights) {
      uncrackedServers.delete(server.hostname);
      crackedServers.add(server.hostname);
      continue;
    }

    if (canCrackServer(ns, server)) {
      crackServer(ns, server);

      uncrackedServers.delete(server.hostname);
      crackedServers.add(server.hostname);
    }
  }

  printCrackProgress(ns, crackedServers, uncrackedServers);
}

function copyHackingScriptsToServer(ns: NS, server: string) {
  const scripts: string[] = ["grow.js", "hack.js", "weaken.js"];
  ns.scp(scripts, server);
}

function disableLogs(ns: NS) {
  ns.disableLog("getHackingLevel");
  ns.disableLog("getServerRequiredHackingLevel");
  ns.disableLog("brutessh");
  ns.disableLog("ftpcrack");
  ns.disableLog("nuke");
  ns.disableLog("scan");
}

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

function canCrackServer(ns: NS, server: Server): boolean {
  return (
    hackLevelEnough(ns, server.hostname) && canOpenAllRequiredPorts(ns, server)
  );
}

function crackServer(ns: NS, server: Server) {
  openPorts(ns, server.hostname);
  ns.nuke(server.hostname);
  copyHackingScriptsToServer(ns, server.hostname);
}

function canOpenAllRequiredPorts(ns: NS, server: Server) {
  const openPortsRequired = server.numOpenPortsRequired;
  if (openPortsRequired === undefined || server.hasAdminRights) {
    return true;
  }

  let openableProgramsCount = 0;
  const programs = [
    "BruteSSH.exe",
    "FTPCrack.exe",
    "relaySTMP.exe",
    "HTTPWorm.exe",
    "SQLInject.exe",
  ];

  for (const program of programs) {
    openableProgramsCount += Number(ns.fileExists(program));
  }

  return openableProgramsCount >= openPortsRequired;
}

function openPorts(ns: NS, serverName: string) {
  ns.print(`Initilizing server ${serverName} for scripts...`);

  if (ns.fileExists("BruteSSH.exe")) {
    ns.brutessh(serverName);
  }

  if (ns.fileExists("FTPCrack.exe")) {
    ns.ftpcrack(serverName);
  }

  if (ns.fileExists("relaySTMP.exe")) {
    ns.relaysmtp(serverName);
  }

  if (ns.fileExists("HTTPWorm.exe")) {
    ns.httpworm(serverName);
  }

  if (ns.fileExists("SQLInject.exe")) {
    ns.sqlinject(serverName);
  }
}
