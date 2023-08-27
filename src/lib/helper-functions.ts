import { NS } from "../../NetscriptDefinitions";

/**
 * Calculates how often a script can run on a host
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {string} script - Name of the script 
 * @param hostname - Host on which the script will be run
 * @returns Amount of threads that can be run on the target
 */
export function calculateThreadAmount(
  ns: NS,
  script: string,
  hostname: string
): number {
  const scriptRamCost = ns.getScriptRam(script);
  const availableRamOnHost =
    ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);

  const threadAmount = Math.floor(availableRamOnHost / scriptRamCost);
  return threadAmount;
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
  const requiredHackingLevel = ns.getServerRequiredHackingLevel(hostname);
  const playerHackingLevel = ns.getHackingLevel();
  return playerHackingLevel >= requiredHackingLevel;
}

/**
 * Disables logs for the given function names
 * @param {NS} ns - Mandatory to access netscript functions
 * @param {string[]} functionNames - List of function names for which the logs will be disabled
 */
export function disableLogs(ns: NS, functionNames: string[]): void {
  functionNames.forEach((functionName) => {
    ns.disableLog(functionName);
  });
}
