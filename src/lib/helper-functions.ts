import { NS } from "../../NetscriptDefinitions";

/**
 * Calculates how often a script can run on a host
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {string} scriptName - Name of the script 
 * @param host - Host on which the script will be run
 * @returns Amount of threads that can be run on the target
 */
export function calculateThreadAmount(
  ns: NS,
  scriptName: string,
  host: string
): number {
  const scriptRamCost = ns.getScriptRam(scriptName);
  const availableRamOnServer =
    ns.getServerMaxRam(host) - ns.getServerUsedRam(host);

  const maxPossibleThreads = Math.floor(availableRamOnServer / scriptRamCost);
  return maxPossibleThreads;
}

/**
 * Waits until the a script hat finished running
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {number} pid - PID of script that should be wait for
 * @param {number} sleepIntervall - Determines the intervall, 
 * which checks if the script is still running
 */
export async function waitUntilScriptFinished(
  ns: NS,
  pid: number,
  sleepIntervall = 1000
): Promise<void> {
  while (ns.isRunning(pid)) {
    await ns.sleep(sleepIntervall);
  }
}

/**
 * Checks if the hack level is high enough for the server
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {string} hostname - Name of the server that will be checked
 * @returns If the hack level is high enough
 */
export function hackLevelEnough(ns: NS, hostname: string): boolean {
  const hackLevelRequired = ns.getServerRequiredHackingLevel(hostname);
  const hackLevel = ns.getHackingLevel();
  return hackLevel >= hackLevelRequired;
}

export function hasSufficientThreads(threadAmount: number): boolean {
  return threadAmount > 0;
}
