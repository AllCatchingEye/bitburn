import { NS, Server } from "@ns";
import { findServers } from "./lib/find-servers";

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.disableLog("sleep");

  const sourceServerName = ns.args[0].toString();
  const targetServerName = ns.args[1].toString();

  let targetServers: string[] = await findServers(ns, sourceServerName);
  await deployScripts(targetServers, ns, targetServerName);
}

async function deployScripts(serverNames: string[], ns: NS, targetServerName: string) {
  ns.print(serverNames);
  for (let serverName of serverNames) {
    await deployScriptOnServer(ns, serverName, targetServerName);
  }
}

async function deployScriptOnServer(ns: NS, serverName: string, targetServerName: string) {
  const server: Server = ns.getServer(serverName);
  const threadAmount = getMaxPossibleThreads(ns, server);

  ns.print(`Trying to deploy script on server ${server.hostname}.`);

  if (canDeployToServer(ns, server, threadAmount)) {
    ns.print(`Copying script to ${server.hostname}.`);
    await ns.scp("hack.js", server.hostname);

    initializeTargetServer(ns, server.hostname);

    ns.print(`Executing script on server ${server.hostname}`);
    executeScriptOnServer(ns, server, threadAmount, targetServerName);
  } else {
    ns.print(`Coudn't deploy script on server ${targetServerName}.`);
  }
}

function canDeployToServer(ns: NS, server: Server, threadAmount: number) {
  return (
    canHackTargetServer(ns, server) &&
    canInitializeTargetServer(ns, server) &&
    hasSufficientThreads(threadAmount)
  );
}

function canHackTargetServer(ns: NS, server: Server) {
  const hackLevelRequired = ns.getServerRequiredHackingLevel(server.hostname);
  const hackLevel = ns.getHackingLevel();
  return hackLevel >= hackLevelRequired;
}

function hasSufficientThreads(threadAmount: number) {
  return threadAmount > 0;
}

function canInitializeTargetServer(ns: NS, targetServerName: Server) {
  const openPortsRequired = targetServerName.numOpenPortsRequired;
  if (openPortsRequired === undefined || targetServerName.hasAdminRights) {
    return true;
  }

  let openableProgramsCount = 0;
  const programs = ["BruteSSH.exe", "FTPCrack.exe", "relaySTMP.exe", "HTTPWorm.exe", "SQLInject.exe"];
  
  for (const program of programs) {
    openableProgramsCount += Number(ns.fileExists(program));
  }

  debugger;
  return openableProgramsCount >= openPortsRequired;
}

function getMaxPossibleThreads(ns: NS, server: Server) {
  const scriptRam = ns.getScriptRam("hack.js");
  const availableRam = server.maxRam - server.ramUsed;

  const threadAmount = Math.max(Math.floor(availableRam / scriptRam));
  return threadAmount;
}

function initializeTargetServer(ns: NS, targetServerName: string) {
  ns.print(`Initilizing server ${targetServerName} for scripts...`);

  if (ns.fileExists("BruteSSH.exe")) {
    ns.brutessh(targetServerName);
  }

  if(ns.fileExists("FTPCrack.exe")) {
    ns.ftpcrack(targetServerName);
  }

  if(ns.fileExists("relaySTMP.exe")) {
    ns.relaysmtp(targetServerName);
  }

  if(ns.fileExists("HTTPWorm.exe")) {
    ns.httpworm(targetServerName);
  }

  if(ns.fileExists("SQLInject.exe")) {
    ns.sqlinject(targetServerName);
  }

  ns.nuke(targetServerName);
}

function executeScriptOnServer(
  ns: NS,
  server: Server,
  threadAmount: number,
  target: string
) {
  ns.print(`Hacking server ${server.hostname} ${threadAmount} times...`);
  ns.exec("hack.js", server.hostname, threadAmount, target);
}
