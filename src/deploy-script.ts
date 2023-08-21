import { NS, Server } from "@ns";
import { findServers } from "./lib/find-servers";

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.disableLog("sleep");

  const src = ns.args[0].toString();
  const target = ns.args[1].toString();

  let foundServers: string[] = await findServers(ns, src);
  await deployScripts(foundServers, ns, target);
}

async function deployScripts(serverNames: string[], ns: NS, target: string) {
  ns.tprint(serverNames);
  for (let serverName of serverNames) {
    await deployScript(ns, serverName, target);
  }
}

async function deployScript(ns: NS, serverName: string, target: string) {
  const server: Server = ns.getServer(serverName);
  const threadAmount = getMaxPossibleThreads(ns, server);
  ns.print(`Trying to deploy script on server ${server.hostname}.`);
  if (canDeployScript(ns, server, threadAmount)) {
    ns.print(`Copying script to ${server.hostname}.`);
    await ns.scp("hack.js", server.hostname);

    initilizeServer(ns, server.hostname);

    ns.print(`Executing script on server ${server.hostname}`);
    executeScriptOnTarget(ns, server, threadAmount, target);
  } else {
    ns.print(`Coudn't deploy script on server ${target}.`);
  }
}

function canDeployScript(ns: NS, server: Server, threadAmount: number) {
  return canHackServer(ns, server)
  && canInitilizeServer(ns, server)
  && hasEnoughRam(ns, server, threadAmount);;
}

function canHackServer(ns: NS, server: Server) {
  const hackLevelRequired = ns.getServerRequiredHackingLevel(server.hostname);
  const hackLevel = ns.getHackingLevel();
  return hackLevel >= hackLevelRequired;
}

function hasEnoughRam(ns: NS, server: Server, threadAmount: number) {
  return threadAmount > 0;
}

function canInitilizeServer(ns: NS, target: Server) {
  const openPortsRequired = target.numOpenPortsRequired;
  if (openPortsRequired === undefined || target.hasAdminRights) {
    return true;
  }

  let openablePorts = 0;
  openablePorts += Number(ns.fileExists("BruteSSH.exe"));
  openablePorts += Number(ns.fileExists("FTPCrack.exe"));
  openablePorts += Number(ns.fileExists("relaySTMP.exe"));
  openablePorts += Number(ns.fileExists("HTTPWorm.exe"));
  openablePorts += Number(ns.fileExists("SQLInject.exe"));

  debugger;
  return openablePorts >= openPortsRequired;
}

function getMaxPossibleThreads(ns: NS, server: Server) {
  const scriptRam = ns.getScriptRam("hack.js");
  const availableRam = server.maxRam - server.ramUsed;

  const threadAmount = Math.max(Math.floor(availableRam / scriptRam));
  return threadAmount;
}

function initilizeServer(ns: NS, target: string) {
  ns.print(`Initilizing server ${target} for scripts...`);
  
  if (ns.fileExists("BruteSSH.exe")) {
    ns.brutessh(target);
  }

  if(ns.fileExists("FTPCrack.exe")) {
    ns.ftpcrack(target);
  }

  if(ns.fileExists("relaySTMP.exe")) {
    ns.relaysmtp(target);
  }

  if(ns.fileExists("HTTPWorm.exe")) {
    ns.httpworm(target);
  }

  if(ns.fileExists("SQLInject.exe")) {
    ns.sqlinject(target);
  }

  ns.nuke(target);
}

function executeScriptOnTarget(
  ns: NS,
  server: Server,
  threadAmount: number,
  target: string
) {
  ns.print(`Hacking server ${server.hostname} ${threadAmount} times...`);
  ns.exec("hack.js", server.hostname, threadAmount, target);
}
