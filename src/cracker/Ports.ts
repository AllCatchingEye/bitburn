import { NS, Server } from "../../NetscriptDefinitions";

export enum PortPrograms {
  SSH = "BruteSSH.exe",
  FTP = "FTPCrack.exe",
  STMP = "relaySTMP.exe",
  HTTP = "HTTPWorm.exe",
  SQL = "SQLInject.exe",
}

/**
 * Checks if the required amount of ports can be opened on a host
 * @param {NS} ns - Mandatory to access netscript functions
 * @returns If the required amount of ports can be opened
 */
export function canOpenAllRequiredPorts(ns: NS, host: Server): boolean {
  if (host.hostname.includes("pserv")) return true;

  const requiredPorts = host.numOpenPortsRequired ?? 0;

  const openablePorts = countOpenablePorts(ns);
  return openablePorts >= requiredPorts;
}

export function countOpenablePorts(ns: NS): number {
  const portPrograms: string[] = getPortPrograms();
  let ownedPortOpenersCount = 0;
  for (const portProgram of portPrograms) {
    ownedPortOpenersCount += Number(ns.fileExists(portProgram, "home"));
  }

  return ownedPortOpenersCount;
}

function getPortPrograms(): string[] {
  const portPrograms = Object.values(PortPrograms);
  return portPrograms;
}

/**
 * Opens all openable ports of the given host
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {Server} host - Host for which the ports will be opened
 */
export function openPorts(ns: NS, host: Server): boolean {
  ns.print(`Initilizing host ${host} for scripts...`);

  if (ns.fileExists("BruteSSH.exe")) {
    ns.brutessh(host.hostname);
  }

  if (ns.fileExists("FTPCrack.exe")) {
    ns.ftpcrack(host.hostname);
  }

  if (ns.fileExists("relaySTMP.exe")) {
    ns.relaysmtp(host.hostname);
  }

  if (ns.fileExists("HTTPWorm.exe")) {
    ns.httpworm(host.hostname);
  }

  if (ns.fileExists("SQLInject.exe")) {
    ns.sqlinject(host.hostname);
  }

  // Get root rights
  ns.nuke(host.hostname);

  // Indicate if rooting was successfull
  return host.hasAdminRights;
}
