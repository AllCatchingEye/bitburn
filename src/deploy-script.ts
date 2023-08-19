import { NS, Server} from "@ns";
import { findServers } from "./lib/find-servers";

/** @param {NS} ns */
export async function main(ns: NS) {
  const src = ns.args[0].toString();
  const target = ns.args[1].toString();

	let foundServers: string[] = await findServers(ns, src);
  await deployScripts(foundServers, ns, target);
}

async function deployScripts(serverNames: string[], ns: NS, target: string) {
  for (let serverName of serverNames) {
    await deployScript(ns, serverName, target);
  }
}

async function deployScript(ns: NS, serverName: string, target: string) {
  const server: Server = ns.getServer(serverName);

  if (canHackServer(ns, server)) {
    const threadAmount = getMaxPossibleThreads(ns, server);

    await ns.scp("hack.js", target);
    initilizeServer(ns, server.hostname);

    executeScriptOnTarget(ns, server, threadAmount, target);
  }
}

function canHackServer(ns: NS, server: Server) {
  const hackLevelRequired = ns.getServerRequiredHackingLevel(server.hostname);
  const hackLevel = ns.getHackingLevel();
  return hackLevel > hackLevelRequired;
}

function getMaxPossibleThreads(ns: NS, server: Server) {
  const scriptRam = ns.getScriptRam("hack.js");
  const availableRam = server.maxRam - server.ramUsed;

  // a threadAmount < 1 causes a runtime error on ns.exec
  const threadAmount = Math.max(Math.floor(availableRam / scriptRam), 1);
  return threadAmount;
}

function initilizeServer(ns: NS, target: string) {
  const sshPortsOpen: boolean = ns.getServer(target).sshPortOpen;
  const ftpPortsOpen: boolean = ns.getServer(target).ftpPortOpen;

  if (ns.fileExists("BruteSSH.exe", "home") && !sshPortsOpen) {
      ns.brutessh(target);
  }

  if (ns.fileExists("FTPCrack.exe", "home") && !ftpPortsOpen) {
      ns.ftpcrack(target);
  }

  ns.nuke(target);
}

function executeScriptOnTarget(ns: NS, server: Server, threadAmount: number, target: string) {
  ns.print(`Hacking server ${server.hostname} ${threadAmount} times...`);
  ns.exec("hack.js", server.hostname, threadAmount, target);
}